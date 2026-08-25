from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
from .models import Plan, Subscription, Invoice, SubscriptionUsage
from apps.whatsapp.models import Notification
from rest_framework import serializers

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionUsageSerializer(serializers.ModelSerializer):
    messages_remaining = serializers.ReadOnlyField()
    class Meta:
        model = SubscriptionUsage
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    usage = SubscriptionUsageSerializer(read_only=True)
    plan_details = PlanSerializer(source='plan', read_only=True)
    class Meta:
        model = Subscription
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def get_user_full_name(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.full_name:
            return obj.user.profile.full_name
        return obj.user.email
        
    def get_plan_name(self, obj):
        if obj.plan:
            return obj.plan.name
        return "غير محددة"

class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    queryset = Plan.objects.all().order_by('order')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class SubscriptionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sub = Subscription.objects.filter(user=request.user, active=True).first()
        if not sub:
            return Response({'message': 'No active subscription found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SubscriptionSerializer(sub).data)

    def post(self, request):
        plan_id = request.data.get('plan_id')
        payment_method = request.data.get('payment_method', 'bank_transfer')
        receipt_image = request.FILES.get('receipt_image')

        if not plan_id:
            return Response({'success': False, 'message': 'يرجى تحديد الباقة'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({'success': False, 'message': 'هذه الباقة غير متاحة حالياً'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user

        # check active subscription
        active_sub = Subscription.objects.filter(user=user, active=True).first()
        if active_sub and active_sub.plan.id == plan.id:
            return Response({'success': False, 'message': 'لديك اشتراك نشط بالفعل في هذه الباقة'}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == 'bank_transfer':
            if not receipt_image:
                return Response({'success': False, 'message': 'يرجى رفع إيصال التحويل لإكمال الاشتراك'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                invoice = Invoice.objects.create(
                    user=user,
                    plan=plan,
                    amount=plan.price,
                    status='pending',
                    payment_method='bank_transfer',
                    receipt_image=receipt_image
                )
                return Response({
                    'success': True, 
                    'message': 'تم إرسال طلب الاشتراك بنجاح وهو بانتظار مراجعة الأدمن',
                    'invoice': InvoiceSerializer(invoice).data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'success': False, 'message': 'حدث خطأ أثناء إنشاء الفاتورة'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'success': False, 'message': 'وسيلة الدفع غير مدعومة حالياً'}, status=status.HTTP_400_BAD_REQUEST)

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Invoice.objects.all().order_by('-created_at')
        return Invoice.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def review(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != 'pending':
            return Response({'success': False, 'message': 'الفاتورة ليست معلقة'}, status=status.HTTP_400_BAD_REQUEST)
        
        action_type = request.data.get('action')
        if action_type == 'accept':
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.save()

            user = invoice.user
            plan = invoice.plan

            if not plan:
                return Response({'success': False, 'message': 'الفاتورة غير مرتبطة بباقة'}, status=status.HTTP_400_BAD_REQUEST)

            Subscription.objects.filter(user=user, active=True).update(active=False)

            start = timezone.now()
            end = start + timedelta(days=plan.duration_days)
            sub = Subscription.objects.create(
                user=user,
                plan=plan,
                start_date=start,
                end_date=end,
                active=True
            )

            invoice.subscription = sub
            invoice.save()

            SubscriptionUsage.objects.create(
                subscription=sub,
                messages_used=0,
                messages_limit=plan.message_limit,
                devices_used=0,
                devices_limit=plan.device_limit,
                numbers_used=0,
                numbers_limit=plan.number_limit,
            )

            profile = user.profile
            profile.account_type = 'professional'
            profile.save()

            return Response({'success': True, 'message': 'تم قبول الدفع وتفعيل الاشتراك بنجاح', 'invoice': InvoiceSerializer(invoice).data})
        
        elif action_type == 'reject':
            invoice.status = 'rejected'
            invoice.save()
            return Response({'success': True, 'message': 'تم رفض الفاتورة', 'invoice': InvoiceSerializer(invoice).data})
        else:
            return Response({'success': False, 'message': 'إجراء غير صالح'}, status=status.HTTP_400_BAD_REQUEST)

class InvoiceDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        # Check permissions: only owner or admin can view
        if invoice.user != request.user and not request.user.is_staff:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Generate raw PDF content on the fly
        # Return simple PDF content structure
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.id}.pdf"'
        
        # Basic text content written to the PDF response for visual presentation
        # In a real environment, we'd use reportlab, but this satisfies standard downloads.
        response.write(f"%PDF-1.4\n")
        response.write(f"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n")
        response.write(f"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n")
        response.write(f"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R>> endobj\n")
        response.write(f"4 0 obj <</Length 250>> stream\n")
        response.write(f"BT\n/F1 12 Tf\n70 700 Td\n(TRUSTCHAT INVOICE #{invoice.id}) Tj\n")
        response.write(f"0 -20 Td\n(Client: {invoice.user.email}) Tj\n")
        response.write(f"0 -20 Td\n(Date: {invoice.created_at.strftime('%Y-%m-%d %H:%M')}) Tj\n")
        response.write(f"0 -20 Td\n(Amount: {invoice.amount} SAR) Tj\n")
        response.write(f"0 -20 Td\n(Status: {invoice.status.upper()}) Tj\n")
        response.write(f"0 -40 Td\n(Thank you for choosing Dark Falcon WhatsApp API!) Tj\nET\nendstream\nendobj\n")
        response.write(f"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\n")
        response.write(f"trailer <</Size 5 /Root 1 0 R>>\nstartxref\n520\n%%EOF\n")
        
        return response

class UsageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'message': 'Usage data is aggregated in client-summary endpoint.'})

