from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class APICriticalFlowsTests(APITestCase):
    def setUp(self):
        # Create two users for permission tests
        self.user1 = User.objects.create_user(username='user1', password='pass1')
        self.user2 = User.objects.create_user(username='user2', password='pass2')

    def obtain_token(self, username, password):
        url = '/api/auth/login/'
        resp = self.client.post(url, {'username': username, 'password': password}, format='json')
        return resp

    def test_register_and_login(self):
        # Register a new user
        resp = self.client.post('/api/auth/register/', {'username': 'newuser', 'password': 'newpass'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', resp.data)

        # Login with same user
        login = self.client.post('/api/auth/login/', {'username': 'newuser', 'password': 'newpass'}, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('access', login.data)

    def test_create_project_authenticated(self):
        # Unauthenticated cannot create
        resp = self.client.post('/api/projects/', {'name': 'P1'}, format='json')
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        # Authenticated can create
        login = self.obtain_token('user1', 'pass1')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp2 = self.client.post('/api/projects/', {'name': 'P1', 'description': 'desc'}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)

    def test_create_issue_requires_auth_and_assignment(self):
        # Create a project as user1
        login = self.obtain_token('user1', 'pass1')
        token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        proj = self.client.post('/api/projects/', {'name': 'ProjA'}, format='json')
        self.assertEqual(proj.status_code, status.HTTP_201_CREATED)
        project_id = proj.data['id']

        # Unauthenticated should not create issue
        self.client.credentials()  # clear
        resp = self.client.post(f'/api/projects/{project_id}/issues/', {'title': 'I1'}, format='json')
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        # Authenticated can create
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        issue = self.client.post(f'/api/projects/{project_id}/issues/', {'title': 'I1', 'description': 'd'}, format='json')
        self.assertEqual(issue.status_code, status.HTTP_201_CREATED)

    def test_update_issue_permission(self):
        # user1 creates project and issue
        login1 = self.obtain_token('user1', 'pass1')
        token1 = login1.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        proj = self.client.post('/api/projects/', {'name': 'P2'}, format='json')
        pid = proj.data['id']
        issue = self.client.post(f'/api/projects/{pid}/issues/', {'title': 'IssueX'}, format='json')
        iid = issue.data['id']

        # user2 tries to update -> should be forbidden
        login2 = self.obtain_token('user2', 'pass2')
        token2 = login2.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')
        resp = self.client.patch(f'/api/issues/{iid}/', {'status': 'closed'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # assign to user2 by user1
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        assign = self.client.patch(f'/api/issues/{iid}/', {'assignee_id': self.user2.id}, format='json')
        self.assertIn(assign.status_code, (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT))

        # now user2 can update
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')
        resp2 = self.client.patch(f'/api/issues/{iid}/', {'status': 'in_progress'}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

    def test_comment_creation_requires_auth(self):
        # Create project and issue as user1
        login1 = self.obtain_token('user1', 'pass1')
        token1 = login1.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        proj = self.client.post('/api/projects/', {'name': 'P3'}, format='json')
        pid = proj.data['id']
        issue = self.client.post(f'/api/projects/{pid}/issues/', {'title': 'IssueY'}, format='json')
        iid = issue.data['id']

        # unauthenticated cannot comment
        self.client.credentials()
        resp = self.client.post(f'/api/issues/{iid}/comments/', {'content': 'hello'}, format='json')
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        # authenticated can comment
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
        c = self.client.post(f'/api/issues/{iid}/comments/', {'content': 'hello'}, format='json')
        self.assertEqual(c.status_code, status.HTTP_201_CREATED)
