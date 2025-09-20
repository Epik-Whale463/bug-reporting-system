from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Project, Issue, Comment

class Command(BaseCommand):
    help = 'Delete all data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-users',
            action='store_true',
            help='Keep user accounts, only delete projects/issues/comments',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            confirm = input('Are you sure you want to delete all data? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write('Cancelled.')
                return

        # Delete in order to avoid foreign key constraints
        comment_count = Comment.objects.count()
        issue_count = Issue.objects.count()
        project_count = Project.objects.count()
        user_count = User.objects.count()

        Comment.objects.all().delete()
        self.stdout.write(f'Deleted {comment_count} comments')
        
        Issue.objects.all().delete()
        self.stdout.write(f'Deleted {issue_count} issues')
        
        Project.objects.all().delete()
        self.stdout.write(f'Deleted {project_count} projects')

        if not options['keep_users']:
            User.objects.all().delete()
            self.stdout.write(f'Deleted {user_count} users')
        else:
            self.stdout.write(f'Kept {user_count} users')

        self.stdout.write(
            self.style.SUCCESS('Successfully deleted all specified data!')
        )