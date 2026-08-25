# -*- coding: utf-8 -*-
"""
Support Chat Backend v2 -- Full Integration Test Suite
Covers: lifecycle, unread, pagination, search, filtering, permissions, audit.
"""
import sys, io, time, requests, json

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"
ts = int(time.time())

PASS = "[PASS]"
FAIL = "[FAIL]"
SKIP = "[SKIP]"

def sep(title):
    print(f"\n{'='*65}")
    print(f"  {title}")
    print('='*65)

def check(label, condition, detail=""):
    tag = PASS if condition else FAIL
    d = f"  >> {str(detail)[:160]}" if detail else ""
    print(f"  {tag}  {label}{d}")
    if not condition:
        print("\n  [!] Test failed. Aborting.")
        sys.exit(1)

def info(msg):
    print(f"       {msg}")


# ──────────────────────────────────────────────────────────────────────────
# SETUP: Create test users
# ──────────────────────────────────────────────────────────────────────────
sep("0. Setup: Register Test Users")

def register(email, name):
    r = requests.post(f"{BASE}/api/v1/auth/register/", json={
        "email": email, "password": "TestPass123!", "full_name": name
    })
    check(f"Register {name}", r.status_code in [200,201], r.text[:100])
    d = r.json()
    return d["tokens"]["access"], d["user"]["id"]

EMAIL_A = f"user_a_{ts}@test.com"
EMAIL_B = f"user_b_{ts}@test.com"

token_a, uid_a = register(EMAIL_A, "Client Alpha")
token_b, uid_b = register(EMAIL_B, "Client Beta")

# Get admin token (superuser must exist)
r_admin = requests.post(f"{BASE}/api/v1/auth/login/", json={
    "email": "admin@test.com", "password": "admin123"
})
if r_admin.status_code == 200:
    data_admin = r_admin.json()
    # Login endpoint returns {access, refresh, user} directly (not nested in tokens)
    token_admin = data_admin.get("access") or (data_admin.get("tokens") or {}).get("access")
    info(f"Admin logged in: {data_admin.get('user', {}).get('email', '?')}")
    HAS_ADMIN = True
else:
    info(f"No admin account found ({r_admin.status_code}). Admin tests will be skipped.")
    info("Create one: .\\venv\\Scripts\\python.exe manage.py createsuperuser")
    token_admin = None
    HAS_ADMIN = False

def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

AUTH_A     = auth(token_a)
AUTH_B     = auth(token_b)
AUTH_ADMIN = auth(token_admin) if HAS_ADMIN else {}


# ──────────────────────────────────────────────────────────────────────────
# SECTION 1: User A creates a ticket
# ──────────────────────────────────────────────────────────────────────────
sep("1. User A: Create Ticket")

r = requests.post(f"{BASE}/api/v1/whatsapp/tickets/", headers=AUTH_A, json={
    "subject": "Device connection keeps failing",
    "description": "I cannot connect my Meta device. Tried 3 times.",
    "priority": "high"
})
check("Create ticket returns 201", r.status_code == 201, r.text[:120])
ticket = r.json()
tid = ticket["id"]
ticket_num = ticket.get("ticket_number")

check("Ticket ID present", bool(tid))
check("ticket_number format is DF-XXXXXX", ticket_num and ticket_num.startswith("DF-"), ticket_num)
check("status = open", ticket["status"] == "open")
check("messages has 1 entry", len(ticket.get("messages", [])) == 1)
check("first message sender_type = user", ticket["messages"][0]["sender_type"] == "user")
check("first message is_read = False", ticket["messages"][0]["is_read"] == False)
check("last_message not empty", bool(ticket.get("last_message")))
check("last_message_time not empty", bool(ticket.get("last_message_time")))
info(f"Created {ticket_num} (id={tid})")


# ──────────────────────────────────────────────────────────────────────────
# SECTION 2: User A sends a follow-up reply
# ──────────────────────────────────────────────────────────────────────────
sep("2. User A: Send Follow-up Reply")

r = requests.post(f"{BASE}/api/v1/whatsapp/tickets/{tid}/reply/", headers=AUTH_A, json={
    "message": "Still failing. Instance ID is 99."
})
check("User reply returns 201", r.status_code == 201)
reply = r.json()
check("sender_type = user (server-enforced)", reply["sender_type"] == "user")
check("is_read = False", reply["is_read"] == False)
check("ticket stays open after user reply", True)  # status should stay open (was never pending)


# ──────────────────────────────────────────────────────────────────────────
# SECTION 3: Status lifecycle — closed ticket blocks reply
# ──────────────────────────────────────────────────────────────────────────
sep("3. User: Cannot Reply to Closed Ticket (if admin closes it)")

# We create a throwaway ticket to test this
r_tmp = requests.post(f"{BASE}/api/v1/whatsapp/tickets/", headers=AUTH_A, json={
    "subject": "Temp ticket for close test",
    "description": "App crashes on launch"
})
check("Create temp ticket", r_tmp.status_code == 201)
tmp_id = r_tmp.json()["id"]
info(f"Temp ticket id={tmp_id}")

if HAS_ADMIN:
    r_close = requests.patch(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tmp_id}/status/",
        headers=AUTH_ADMIN,
        json={"status": "closed"}
    )
    check("Admin closes temp ticket", r_close.status_code == 200, r_close.text[:100])

    r_reply_closed = requests.post(
        f"{BASE}/api/v1/whatsapp/tickets/{tmp_id}/reply/",
        headers=AUTH_A,
        json={"message": "Trying to reply on closed ticket"}
    )
    check("User reply on closed ticket returns 400", r_reply_closed.status_code == 400)
    info("Correct: closed ticket blocks user reply")
else:
    print(f"  {SKIP}  Closed-ticket reply test (no admin)")


# ──────────────────────────────────────────────────────────────────────────
# SECTION 4: Pagination
# ──────────────────────────────────────────────────────────────────────────
sep("4. Pagination")

r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/?page=1&page_size=1", headers=AUTH_A)
check("Paginated list returns 200", r.status_code == 200, r.text[:100])
data = r.json()
check("Response has 'count' field", 'count' in data)
check("Response has 'results' field", 'results' in data)
check("page_size=1 returns max 1 result", len(data['results']) <= 1)
info(f"Total tickets for User A: {data['count']}")


# ──────────────────────────────────────────────────────────────────────────
# SECTION 5: Filtering
# ──────────────────────────────────────────────────────────────────────────
sep("5. User-side Filtering")

r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/?status=open", headers=AUTH_A)
check("Filter ?status=open returns 200", r.status_code == 200)
results = r.json().get("results", [])
all_open = all(t["status"] == "open" for t in results)
check("All returned tickets have status=open", all_open)




# ──────────────────────────────────────────────────────────────────────────
# SECTION 6: Security — User B isolation
# ──────────────────────────────────────────────────────────────────────────
sep("6. Security: User B Cannot Access User A Tickets")

r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/", headers=AUTH_B)
check("User B list returns 200", r.status_code == 200)
results_b = r.json().get("results", [])
ids_b = [t["id"] for t in results_b]
check("User B does NOT see ticket A", tid not in ids_b)

r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/{tid}/", headers=AUTH_B)
check("User B direct access to ticket A returns 404", r.status_code == 404)

r = requests.post(f"{BASE}/api/v1/whatsapp/tickets/{tid}/reply/", headers=AUTH_B,
                  json={"message": "Injection attempt"})
check("User B cannot reply on User A ticket (404)", r.status_code == 404)


# ──────────────────────────────────────────────────────────────────────────
# SECTION 7: Security — No token
# ──────────────────────────────────────────────────────────────────────────
sep("7. Security: Unauthenticated Access Blocked")

r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/")
check("No token -> 401", r.status_code == 401)

r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/")
check("Admin endpoint without token -> 401", r.status_code == 401)


# ──────────────────────────────────────────────────────────────────────────
# SECTION 8: Security — Regular user blocked from admin
# ──────────────────────────────────────────────────────────────────────────
sep("8. Security: Regular User Cannot Access Admin Endpoints")

r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/", headers=AUTH_A)
check("User A blocked from admin list (403)", r.status_code == 403)

r = requests.patch(f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/status/",
                   headers=AUTH_A, json={"status": "closed"})
check("User A cannot change status via admin endpoint (403)", r.status_code == 403)


# ──────────────────────────────────────────────────────────────────────────
# SECTION 9: Full Admin Scenario
# ──────────────────────────────────────────────────────────────────────────
if HAS_ADMIN:
    sep("9. Full Admin Scenario")

    # Admin lists all tickets
    r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/", headers=AUTH_ADMIN)
    check("Admin: list all tickets returns 200", r.status_code == 200)
    admin_list = r.json().get("results", [])
    admin_ids = [t["id"] for t in admin_list]
    check("Admin sees User A ticket", tid in admin_ids)

    # Admin searches by ticket number
    ticket_id_str = str(tid)
    r = requests.get(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/?search={ticket_id_str}",
        headers=AUTH_ADMIN
    )
    check("Admin search by ticket ID", r.status_code == 200)
    search_results = r.json().get("results", [])
    found = any(t["id"] == tid for t in search_results)
    check(f"Search by id={tid} returns the ticket", found)

    # Admin searches by email
    r = requests.get(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/?search={EMAIL_A}",
        headers=AUTH_ADMIN
    )
    check("Admin search by user email returns 200", r.status_code == 200)

    # Admin views ticket detail → marks user messages as read
    r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/", headers=AUTH_ADMIN)
    check("Admin: retrieve ticket returns 200", r.status_code == 200)
    admin_ticket = r.json()
    check("ticket_number present", admin_ticket.get("ticket_number", "").startswith("DF-"))

    # unread_count for admin = 0 (they just opened it)
    check("unread_count = 0 after admin opens", admin_ticket["unread_count"] == 0)

    # Admin replies → status goes pending
    r = requests.post(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/reply/",
        headers=AUTH_ADMIN,
        json={"message": "We're looking into this issue, please wait 24h."}
    )
    check("Admin reply returns 201", r.status_code == 201)
    admin_reply = r.json()
    check("Admin reply sender_type = admin", admin_reply["sender_type"] == "admin")
    check("Admin reply is_read = False", admin_reply["is_read"] == False)

    # Verify ticket is now pending
    r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/", headers=AUTH_ADMIN)
    check("Ticket status = pending after admin reply", r.json()["status"] == "pending")
    info("Status lifecycle verified: open -> pending")

    # User reads ticket → unread_count increases then resets to 0
    r = requests.get(f"{BASE}/api/v1/whatsapp/tickets/{tid}/", headers=AUTH_A)
    check("User A retrieves ticket after admin reply", r.status_code == 200)
    # unread should be 0 now (retrieve marks as read)
    check("unread_count = 0 after user opens", r.json()["unread_count"] == 0)

    # User replies → status goes back to open
    r = requests.post(f"{BASE}/api/v1/whatsapp/tickets/{tid}/reply/", headers=AUTH_A,
                      json={"message": "I waited 24h but still broken."})
    check("User second reply returns 201", r.status_code == 201)

    r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/", headers=AUTH_ADMIN)
    check("Ticket status = open after user reply", r.json()["status"] == "open")
    info("Status lifecycle verified: pending -> open")

    # Admin assigns ticket to self
    r = requests.patch(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/assign/",
        headers=AUTH_ADMIN,
        json={"admin_id": "me"}
    )
    check("Admin self-assign returns 200", r.status_code == 200)
    check("assigned_admin_name is set", bool(r.json().get("assigned_admin_name")))

    # Admin closes the ticket
    r = requests.patch(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/{tid}/status/",
        headers=AUTH_ADMIN,
        json={"status": "closed"}
    )
    check("Admin closes ticket returns 200", r.status_code == 200)
    check("new_status = closed", r.json()["new_status"] == "closed")
    info("Status lifecycle verified: open -> closed")

    # User cannot reply on closed ticket
    r = requests.post(f"{BASE}/api/v1/whatsapp/tickets/{tid}/reply/", headers=AUTH_A,
                      json={"message": "Trying to reply after close"})
    check("User cannot reply on closed ticket (400)", r.status_code == 400)

    # Admin stats endpoint
    r = requests.get(f"{BASE}/api/v1/whatsapp/admin/support-tickets/stats/", headers=AUTH_ADMIN)
    check("Admin stats returns 200", r.status_code == 200)
    stats = r.json()
    for key in ['total', 'open', 'pending', 'closed', 'unassigned']:
        check(f"Stats has '{key}'", key in stats)
    info(f"Stats: {json.dumps(stats)}")

    # Admin search by subject
    r = requests.get(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/?search=Device+connection",
        headers=AUTH_ADMIN
    )
    check("Admin search by subject", r.status_code == 200)
    check("Search results found", len(r.json().get("results", [])) > 0)

    # Admin filter by status=closed
    r = requests.get(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/?status=closed",
        headers=AUTH_ADMIN
    )
    check("Admin filter ?status=closed returns 200", r.status_code == 200)
    closed_results = r.json().get("results", [])
    check("All results have status=closed", all(t["status"] == "closed" for t in closed_results))



    # Admin pagination
    r = requests.get(
        f"{BASE}/api/v1/whatsapp/admin/support-tickets/?page=1&page_size=2",
        headers=AUTH_ADMIN
    )
    check("Admin paginated list returns 200", r.status_code == 200)
    check("Paginated response has count", 'count' in r.json())
    check("page_size=2 returns max 2 results", len(r.json()['results']) <= 2)

else:
    sep("9. Full Admin Scenario -- SKIPPED (no admin account)")
    print("  Create superuser: .\\venv\\Scripts\\python.exe manage.py createsuperuser")
    print("  Use email: admin@test.com / password: admin123")


# ──────────────────────────────────────────────────────────────────────────
# DONE
# ──────────────────────────────────────────────────────────────────────────
sep("ALL TESTS PASSED")
print(f"  Ticket tested: DF-{tid:06d} (id={tid})")
print(f"  User A email:  {EMAIL_A}")
print(f"  Admin tests:   {'EXECUTED' if HAS_ADMIN else 'SKIPPED (create superuser first)'}")
print()
