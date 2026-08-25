# ---------------------------------------------------------------------------
# Support Chat Views — User & Admin
# File: apps/whatsapp/support_views.py
# ---------------------------------------------------------------------------
# Enhancements in v2:
#  - ticket_number (DF-XXXXXX) in all responses
#  - Correct status lifecycle: open -> pending -> open -> closed
#  - Full search: id, email, name, subject
#  - AdminAuditLog for all admin actions
#  - attachments field (stored as media URLs) for future use
#  - Consistent unread_count from correct perspective
#  - Pagination on all list endpoints
#  - All permissions enforced at DB level
# ---------------------------------------------------------------------------

import logging
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import SupportTicket, TicketMessage
from .serializers import (
    SupportTicketSerializer,
    SupportTicketListSerializer,
    TicketMessageSerializer,
)
from apps.accounts.models import AdminAuditLog

logger = logging.getLogger(__name__)
User = get_user_model()


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class TicketPagination(PageNumberPagination):
    """
    Standard paginator: default 20 per page, max 100.
    Client sends: ?page=2&page_size=20
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------

class IsAdminOrSuperuser(permissions.BasePermission):
    """
    Grants access if the user is:
    - Django superuser, OR
    - is_staff=True, OR
    - has an active admin_role assigned via Profile
    """
    message = 'Access restricted to admin users only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        profile = getattr(request.user, 'profile', None)
        if profile and profile.admin_role and profile.admin_role.is_active:
            return True
        return False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request):
    """Extract real client IP, accounting for proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _log_admin_action(admin_user, action_type, details, request=None):
    """Write an entry to AdminAuditLog for traceability."""
    try:
        AdminAuditLog.objects.create(
            admin=admin_user,
            action_type=action_type,
            details=details,
            ip_address=_get_client_ip(request) if request else None,
        )
    except Exception as e:
        logger.error(f"AdminAuditLog write failed: {e}")


def _is_admin_user(user):
    """Return True if the user is staff/superuser or has an active admin role."""
    if user.is_superuser or user.is_staff:
        return True
    profile = getattr(user, 'profile', None)
    return bool(profile and profile.admin_role and profile.admin_role.is_active)


# ---------------------------------------------------------------------------
# USER — Support Ticket ViewSet
# Endpoint: /api/v1/whatsapp/tickets/
# ---------------------------------------------------------------------------

class SupportTicketViewSet(viewsets.GenericViewSet):
    """
    Support ticket management for regular (non-admin) users.

    Ticket Status Lifecycle:
      User creates   → status = open
      Admin replies  → status = pending  (waiting for user)
      User replies   → status = open     (waiting for admin)
      Admin closes   → status = closed
      User CANNOT change status manually

    Security:
      - Users can ONLY see/reply to their OWN tickets (enforced at DB level)
      - sender_type is set server-side — never trusted from client
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = TicketPagination

    def get_queryset(self):
        # STRICT: DB-level filter — users only see their own tickets
        return SupportTicket.objects.filter(
            user=self.request.user
        ).select_related(
            'user', 'user__profile',
            'assigned_to', 'assigned_to__profile'
        ).prefetch_related('messages').order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    # ── GET /tickets/ ─────────────────────────────────────────────────────
    def list(self, request):
        """
        List the current user's tickets.
        Supports filtering: ?status=open
        Supports pagination: ?page=1&page_size=20
        """
        queryset = self.get_queryset()

        status_filter = request.query_params.get('status')
        if status_filter and status_filter in ['open', 'pending', 'closed']:
            queryset = queryset.filter(status=status_filter)

        

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ── POST /tickets/ ────────────────────────────────────────────────────
    def create(self, request):
        """
        Create a new support ticket.
        - status is always set to 'open' server-side
        - First TicketMessage is auto-created from 'description'
        - sender_type is always 'user' — not trusted from client
        """
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()

        if not subject:
            return Response({'error': 'Subject is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not description:
            return Response(
                {'error': 'Description (initial message) is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        

        # Create ticket — status always starts as 'open'
        ticket = SupportTicket.objects.create(
            user=request.user,
            subject=subject,
            description=description,
            status='open',
        )

        # Auto-create first message from description
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='user',  # always server-enforced
            message=description,
            is_read=False,
        )

        logger.info(f"New support ticket DF-{ticket.id:06d} created by {request.user.email}")

        serializer = SupportTicketSerializer(ticket, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ── GET /tickets/{id}/ ────────────────────────────────────────────────
    def retrieve(self, request, pk=None):
        """
        Retrieve a ticket detail + all messages.
        Marks all admin messages as read (user has read them).
        """
        ticket = get_object_or_404(SupportTicket, pk=pk, user=request.user)

        # Mark admin messages as read
        unread_before = ticket.messages.filter(sender_type='admin', is_read=False).count()
        if unread_before:
            ticket.messages.filter(sender_type='admin', is_read=False).update(is_read=True)

        serializer = SupportTicketSerializer(ticket, context=self.get_serializer_context())
        return Response(serializer.data)

    # ── POST /tickets/{id}/reply/ ─────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        User sends a reply on their own ticket.

        Status lifecycle:
          - pending → open  (user replied, waiting for admin again)
          - closed  → REJECTED (cannot reply on closed ticket)
        """
        ticket = get_object_or_404(SupportTicket, pk=pk, user=request.user)

        if ticket.status == 'closed':
            return Response(
                {'error': 'This ticket is closed. Please open a new ticket if you need further assistance.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='user',  # always server-enforced
            message=message_text,
            is_read=False,
        )

        # Status lifecycle: pending → open (user replied)
        if ticket.status == 'pending':
            ticket.status = 'open'
            ticket.save(update_fields=['status', 'updated_at'])

        return Response(
            TicketMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    # ── GET /tickets/{id}/messages/ ───────────────────────────────────────
    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        """
        Get all messages for the ticket in chronological order.
        Marks admin messages as read.
        """
        ticket = get_object_or_404(SupportTicket, pk=pk, user=request.user)

        # Mark admin messages as read
        ticket.messages.filter(sender_type='admin', is_read=False).update(is_read=True)

        msgs = ticket.messages.order_by('created_at')
        serializer = TicketMessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# ADMIN — Support Ticket ViewSet
# Endpoint: /api/v1/whatsapp/admin/support-tickets/
# ---------------------------------------------------------------------------

class AdminSupportTicketViewSet(viewsets.GenericViewSet):
    """
    Full admin interface for support ticket management.

    Admins can:
      - See ALL tickets in the system
      - Reply as admin (auto-sets status to pending, auto-assigns if unassigned)
      - Change status manually (open/pending/closed)
      - Assign ticket to any admin
      - View aggregate stats

    All admin actions are logged to AdminAuditLog.
    """
    permission_classes = [IsAdminOrSuperuser]
    pagination_class = TicketPagination

    def get_queryset(self):
        return SupportTicket.objects.select_related(
            'user', 'user__profile',
            'assigned_to', 'assigned_to__profile'
        ).prefetch_related('messages').order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    # ── GET /admin/support-tickets/ ───────────────────────────────────────
    def list(self, request):
        """
        List ALL tickets with full search + filtering support.

        Search (q= or search=):
          - ticket ID / number (e.g. '125' or 'DF-000125')
          - user email
          - user full name
          - ticket subject

        Filters:
          ?status=open|pending|closed
          ?assigned_to=me|unassigned|<admin_id>

        Pagination:
          ?page=1&page_size=20
        """
        queryset = self.get_queryset()

        # ── Search ────────────────────────────────────────────────────────
        search = (
            request.query_params.get('search') or
            request.query_params.get('q') or
            ''
        ).strip()

        if search:
            # Allow searching by ticket number like "DF-000125" or just "125"
            ticket_id_search = None
            clean = search.upper().replace('DF-', '').strip()
            if clean.isdigit():
                ticket_id_search = int(clean)

            q_filter = (
                Q(subject__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__profile__full_name__icontains=search)
            )
            if ticket_id_search is not None:
                q_filter |= Q(id=ticket_id_search)

            queryset = queryset.filter(q_filter).distinct()

        # ── Filters ───────────────────────────────────────────────────────
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in ['open', 'pending', 'closed']:
            queryset = queryset.filter(status=status_filter)

        

        assigned_filter = request.query_params.get('assigned_to')
        if assigned_filter == 'me':
            queryset = queryset.filter(assigned_to=request.user)
        elif assigned_filter == 'unassigned':
            queryset = queryset.filter(assigned_to__isnull=True)
        elif assigned_filter and assigned_filter.isdigit():
            queryset = queryset.filter(assigned_to_id=int(assigned_filter))

        # ── Paginate ──────────────────────────────────────────────────────
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ── GET /admin/support-tickets/{id}/ ─────────────────────────────────
    def retrieve(self, request, pk=None):
        """
        Retrieve full ticket details + all messages.
        Marks all user messages as read (admin has read them).
        """
        ticket = get_object_or_404(SupportTicket, pk=pk)

        # Mark user messages as read
        ticket.messages.filter(sender_type='user', is_read=False).update(is_read=True)

        serializer = SupportTicketSerializer(ticket, context=self.get_serializer_context())
        return Response(serializer.data)

    # ── POST /admin/support-tickets/{id}/reply/ ───────────────────────────
    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """
        Admin sends a reply on any ticket.

        Status lifecycle:
          - open   → pending  (admin replied, waiting for user)
          - closed → pending  (admin re-opened by replying)
          - pending → pending  (unchanged)

        Auto-assigns ticket to replying admin if currently unassigned.
        Logs to AdminAuditLog.
        """
        ticket = get_object_or_404(SupportTicket, pk=pk)

        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='admin',  # always server-enforced
            message=message_text,
            is_read=False,
        )

        fields_to_save = ['updated_at']

        # Status lifecycle: open/closed → pending (admin replied)
        if ticket.status in ['open', 'closed']:
            old_status = ticket.status
            ticket.status = 'pending'
            fields_to_save.append('status')

        # Auto-assign to replying admin if ticket is unassigned
        if not ticket.assigned_to:
            ticket.assigned_to = request.user
            fields_to_save.append('assigned_to')

        if len(fields_to_save) > 1:
            ticket.save(update_fields=fields_to_save)

        # Audit log
        _log_admin_action(
            admin_user=request.user,
            action_type='SUPPORT_ADMIN_REPLY',
            details=f'Admin replied on Ticket DF-{ticket.id:06d} | Status → pending',
            request=request,
        )

        return Response(
            TicketMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    # ── PATCH /admin/support-tickets/{id}/status/ ─────────────────────────
    @action(detail=True, methods=['patch'], url_path='status')
    def change_status(self, request, pk=None):
        """
        Manually change ticket status.
        Allowed transitions: open ↔ pending ↔ closed

        Body: { "status": "closed" }
        Logs to AdminAuditLog.
        """
        ticket = get_object_or_404(SupportTicket, pk=pk)
        new_status = request.data.get('status', '').strip()

        if new_status not in ['open', 'pending', 'closed']:
            return Response(
                {'error': "Status must be one of: 'open', 'pending', 'closed'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = ticket.status
        if old_status == new_status:
            return Response(
                {'message': f'Ticket is already {new_status}.', 'id': ticket.id},
                status=status.HTTP_200_OK
            )

        ticket.status = new_status
        ticket.save(update_fields=['status', 'updated_at'])

        _log_admin_action(
            admin_user=request.user,
            action_type='SUPPORT_STATUS_CHANGE',
            details=f'Ticket DF-{ticket.id:06d}: {old_status} → {new_status}',
            request=request,
        )

        return Response({
            'id': ticket.id,
            'ticket_number': f'DF-{ticket.id:06d}',
            'old_status': old_status,
            'new_status': new_status,
            'message': f'Ticket DF-{ticket.id:06d} status changed from {old_status} to {new_status}.'
        })

    # ── PATCH /admin/support-tickets/{id}/assign/ ─────────────────────────
    @action(detail=True, methods=['patch'], url_path='assign')
    def assign(self, request, pk=None):
        """
        Assign ticket to an admin user.

        Body options:
          { "admin_id": 5 }     → assign to admin user #5
          { "admin_id": "me" }  → self-assign
          {}                    → unassign (set to null)

        Validates that the target user is actually an admin.
        Logs to AdminAuditLog.
        """
        ticket = get_object_or_404(SupportTicket, pk=pk)
        admin_id = request.data.get('admin_id')
        previous_admin = ticket.assigned_to

        if admin_id == 'me':
            ticket.assigned_to = request.user
            assigned_name = request.user.email

        elif admin_id:
            try:
                admin_user = User.objects.select_related('profile__admin_role').get(pk=admin_id)
            except User.DoesNotExist:
                return Response({'error': 'Admin user not found.'}, status=status.HTTP_404_NOT_FOUND)

            if not _is_admin_user(admin_user):
                return Response(
                    {'error': 'The specified user is not an admin.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            ticket.assigned_to = admin_user
            assigned_name = admin_user.email

        else:
            # Unassign
            ticket.assigned_to = None
            assigned_name = 'Unassigned'

        ticket.save(update_fields=['assigned_to', 'updated_at'])

        prev_name = previous_admin.email if previous_admin else 'Unassigned'
        _log_admin_action(
            admin_user=request.user,
            action_type='SUPPORT_ASSIGN',
            details=f'Ticket DF-{ticket.id:06d}: assigned from [{prev_name}] to [{assigned_name}]',
            request=request,
        )

        serializer = SupportTicketListSerializer(ticket, context=self.get_serializer_context())
        return Response(serializer.data)

    # ── GET /admin/support-tickets/stats/ ─────────────────────────────────
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Quick stats for admin dashboard widgets.
        No pagination needed — returns a single aggregate object.
        """
        qs = SupportTicket.objects.all()
        active_qs = qs.filter(status__in=['open', 'pending'])

        return Response({
            'total': qs.count(),
            'open': qs.filter(status='open').count(),
            'pending': qs.filter(status='pending').count(),
            'closed': qs.filter(status='closed').count(),
            'unassigned': active_qs.filter(assigned_to__isnull=True).count(),
            'assigned_to_me': active_qs.filter(assigned_to=request.user).count()
        })

    # ── GET /admin/support-tickets/{id}/messages/ ─────────────────────────
    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        """
        Get all messages for a ticket in chronological order (admin view).
        Marks all user messages as read.
        """
        ticket = get_object_or_404(SupportTicket, pk=pk)

        # Mark user messages as read
        ticket.messages.filter(sender_type='user', is_read=False).update(is_read=True)

        msgs = ticket.messages.order_by('created_at')
        serializer = TicketMessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)
