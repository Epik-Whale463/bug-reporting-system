from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile

class Command(BaseCommand):
    help = 'Ensure all users have UserProfile objects with correct permissions'

    def handle(self, *args, **options):
        users_without_profiles = User.objects.filter(profile__isnull=True)
        
        if not users_without_profiles.exists():
            self.stdout.write(self.style.SUCCESS('All users already have profiles'))
            return
        
        created_count = 0
        for user in users_without_profiles:
            UserProfile.objects.create(
                user=user,
                role='developer',
                can_create_projects=True,
                can_delete_issues=False,
                can_assign_issues=False
            )
            created_count += 1
            self.stdout.write(f'Created profile for user: {user.username}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} user profiles')
        )