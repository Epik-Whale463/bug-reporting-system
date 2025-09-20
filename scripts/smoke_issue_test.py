import urllib.request, json
BASE='http://127.0.0.1:8000/api'

def do(method, path, data=None):
    url = BASE + path
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type':'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            text = resp.read().decode('utf-8')
            print(f"{method} {path} -> {resp.status}\n{text}\n")
    except urllib.error.HTTPError as e:
        try:
            print(f"{method} {path} -> {e.code}\n{e.read().decode('utf-8')}\n")
        except Exception:
            print(f"{method} {path} -> {e.code} (no body)\n")
    except Exception as e:
        print(f"{method} {path} -> ERROR: {e}\n")

# GET project
print('--- GET project ---')
do('GET','/projects/1/')
# POST new issue nested (no auth)
print('--- POST create issue (no auth) ---')
do('POST','/projects/1/issues/', {'title':'Test issue from script','description':'scripted','priority':'medium','assignee_id':None})
# GET users
print('--- GET users endpoint ---')
do('GET','/users/')
