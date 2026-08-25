import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'darkfalcon.settings')
django.setup()

from celery import shared_task

@shared_task(bind=True)
def my_test_task(self, a, b, c):
    print(f"self: {self}")
    print(f"a: {a}")
    print(f"b: {b}")
    print(f"c: {c}")

print("Calling my_test_task.apply(args=[1, 2, 3]):")
res = my_test_task.apply(args=[1, 2, 3])
print(f"Result status: {res.status}")
