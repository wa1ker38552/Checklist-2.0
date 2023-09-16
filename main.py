from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
from helper import is_authenticated
from database import Database
from helper import get_id
import flask
import json
import os

app = flask.Flask(__name__)
app.secret_key = os.urandom(12)

GOOGLE_CLIENT_ID = os.environ['GOOGLE_CLIENT_ID']
GOOGLE_CLIENT_SECRET = os.environ['GOOGLE_CLIENT_SECRET']
oauth = OAuth(app)
exec(os.environ['BUILD_DB'])

@app.route('/')
def app_index():
  if is_authenticated(flask.request, db):
    return flask.redirect('/tasks/active')
  return flask.render_template('login.html')

@app.route('/tasks/active')
def app_tasks_active():
  if is_authenticated(flask.request, db):
    return flask.render_template('active_tasks.html')
  return flask.redirect('/')

@app.route('/tasks/completed')
def app_tasks_completed():
  if is_authenticated(flask.request, db):
    return flask.render_template('completed_tasks.html')
  return flask.redirect('/')

@app.route('/export')
def app_export():
  if is_authenticated(flask.request, db):
    data = db.get_key(['account_data', get_id(flask.request), 'tasks'])
    return data
  else:
    return {'Success': False, 'message': 'Unauthorized'}

@app.route('/google/')
def app_google():
  oauth.register(name='google',
                 client_id=GOOGLE_CLIENT_ID,
                 client_secret=GOOGLE_CLIENT_SECRET,
                 server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
                 client_kwargs={'scope': 'openid email profile'})

  # Redirect to google_auth function
  redirect_uri = flask.url_for('api_callback', _external=True)
  flask.session['nonce'] = generate_token()
  return oauth.google.authorize_redirect(redirect_uri, nonce=flask.session['nonce'])

@app.route('/callback/')
def api_callback():
  if flask.request.args.get('token'):
    response = flask.make_response(flask.redirect('/', code=302))
    response.set_cookie('Authorization', flask.request.args.get('token'))
    return response
  
  token = oauth.google.authorize_access_token()
  user = oauth.google.parse_id_token(token, nonce=flask.session['nonce'])
  flask.session['user'] = user

  if str(user['sub']) not in db.get_key('account_data'):
    db.set_key(['account_data', user['sub']], {
      'id': user['sub'],
      'email': user['email'],
      'groups': [],
      'tasks': {
        'active': [],
        'completed': []
      }
    })

  cookie = f'{user["sub"]}.{hash(user["email"])}'
  response = flask.make_response(flask.redirect('/', code=302))
  response.set_cookie('Authorization', cookie)
  return response

@app.route('/login', methods=['POST'])
def api_login():
  data = json.loads(flask.request.data.decode('utf-8'))
  if data['username'] in db.get_key('account_data'):
    if 'password' in db.get_key(['account_data', data['username']]) and data['password'] == db.get_key(['account_data', data['username'], 'password']):
      token = f"{data['username']}.{hash(data['password'])}"
      return {'success': True, 'token': token}
  return {'success': False, 'message': 'Invalid username or password'}

@app.route('/signup', methods=['POST'])
def api_signup():
  data = json.loads(flask.request.data.decode('utf-8'))
  account_data = db.get_key('account_data')
  if data['username'] in account_data:
    return {'success': False, 'message': 'Username already exists'}
  if len(data['username']) < 4 or len(data['username']) > 15:
    return {'success': False, 'message': 'Username must be between 4 and 15 characters'}
  if data['password'].strip() == '':
    return {'success': False, 'message': 'Password cannot be empty'}
  for char in data['username']:
    if char not in list('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'):
      return {'success': False, 'message': f'Invalid character in username ({char})'}

  token = f"{data['username']}.{data['password']}"
  db.set_key(['account_data', data['username']], {
    'username': data['username'],
    'password': data['password'],
    'groups': [],
    'tasks': {
      'active': [],
      'completed': []
    }
  })
  return {'success': True, 'token': token}

@app.route('/logout')
def app_logout():
  if flask.request.cookies.get('Authorization'):
    response = flask.make_response(flask.redirect('/', code=302))
    response.set_cookie('Authorization', '', expires=0)
    return response
  return flask.redirect('/')

@app.route('/api/fetch/groups')
def api_fetch_groups():
  if is_authenticated(flask.request, db):
    return {
      'success': True,
      'groups': db.get_key(['account_data', get_id(flask.request), 'groups'])
    }
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/fetch/tasks')
def api_fetch_tasks():
  if is_authenticated(flask.request, db):
    if flask.request.args.get('type'):
      if flask.request.args.get('type') in ['active', 'completed']:
        return {
          'success': True,
          'tasks': db.get_key(['account_data', get_id(flask.request), 'tasks', flask.request.args.get('type')])
        }
      return {'success': False, 'message': f'Invalid type {flask.request.args.get("type")}'}
    return {'success': False, 'messsage': 'Parameter type is required'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/fetch/task')
def api_fetch_task():
  if is_authenticated(flask.request, db):
    index = flask.request.args.get('index')
    if index:
      tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
      if int(index) < len(tasks) and int(index) >= 0:
        return {'success': True, 'data': tasks[int(index)]}
      return {'success': False, 'message': 'Task does not exist'}
    return {'success': False, 'message': 'Missing parameter index'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/create/group', methods=['POST'])
def api_create_group():
  if is_authenticated(flask.request, db):
    data = json.loads(flask.request.data.decode('utf-8'))
    if len(data['name']) > 15 or len(data['name']) < 1:
      return {'success': False, 'message': 'Invalid amount of characters'}
      
    group_names = [g['name'] for g in db.get_key(['account_data', get_id(flask.request), 'groups'])]
    if data['name'] in group_names:
      return {'success': False, 'message': 'Group already exists'}

    groups = db.get_key(['account_data', get_id(flask.request), 'groups'])
    groups.append({
      'name': data['name'],
      'color': data['color']
    })
    db.set_key(['account_data', get_id(flask.request), 'groups'], groups)
    return {'success': True}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/create/task', methods=['POST'])
def api_create_task():
  if is_authenticated(flask.request, db):
    data = json.loads(flask.request.data.decode('utf-8'))
    if len(data['name']) < 1 or len(data['name']) > 50:
      return {'success': False, 'message': 'Invalid amount of characters'}
    group = None
    if data['group']:
      groups = db.get_key(['account_data', get_id(flask.request), 'groups'])
      group_names = [g['name'] for g in groups]
      if data['group'] not in group_names:
        return {'success': False, 'message': 'Group does not exist'}
      group = groups[group_names.index(data['group'])]
    tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
    tasks.append({
      'name': data['name'],
      'group': group,
      'important': data['important']
    })
    db.set_key(['account_data', get_id(flask.request), 'tasks', 'active'], tasks)
    return {'success': True}
  
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/delete/group', methods=['POST'])
def api_delete_group():
  if is_authenticated(flask.request, db):
    data = json.loads(flask.request.data.decode('utf-8'))
    group_names = [g['name'] for g in db.get_key(['account_data', get_id(flask.request), 'groups'])]
    if data['name'] in group_names:
      groups = db.get_key(['account_data', get_id(flask.request), 'groups'])
      groups.pop(group_names.index(data['name']))
      db.set_key(['account_data', get_id(flask.request), 'groups'], groups)
      return {'success': True}
    return {'success': False, 'message': 'Group does not exist'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/configure/delete', methods=['POST'])
def api_configure_delete():
  if is_authenticated(flask.request, db):
    type = flask.request.args.get('type')
    if type in ['active', 'completed']:  
      tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', type])
      data = json.loads(flask.request.data.decode('utf-8'))
      if data['index'] < len(tasks) and data['index'] >= 0:
        tasks.pop(data['index'])
        db.set_key(['account_data', get_id(flask.request), 'tasks', type], tasks)
        return {'success': True}
      return {'success': False, 'message': 'Task does not exist'}
    return {'success': False, 'message': 'Missing parameter type or invalid parameter type'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/configure/star', methods=['POST'])
def api_configure_star():
  if is_authenticated(flask.request, db):
    tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
    data = json.loads(flask.request.data.decode('utf-8'))
    if data['index'] < len(tasks) and data['index'] >= 0:
      tasks[data['index']]['important'] = not tasks[data['index']]['important']
      db.set_key(['account_data', get_id(flask.request), 'tasks', 'active'], tasks)
      return {'success': True}
    return {'success': False, 'message': 'Task does not exist'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/configure/check', methods=['POST'])
def api_configure_check():
  if is_authenticated(flask.request, db):
    tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
    data = json.loads(flask.request.data.decode('utf-8'))
    if data['index'] < len(tasks) and data['index'] >= 0:
      save = tasks[data['index']]
      tasks.pop(data['index'])
      completed = db.get_key(['account_data', get_id(flask.request), 'tasks', 'completed'])
      completed.append(save)
      db.set_key(['account_data', get_id(flask.request), 'tasks', 'active'], tasks)
      db.set_key(['account_data', get_id(flask.request), 'tasks', 'completed'], completed)
      return {'success': True}
    return {'success': False, 'message': 'Task does not exist'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/configure/restore', methods=['POST'])
def api_configure_restore():
  if is_authenticated(flask.request, db):
    tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'completed'])
    data = json.loads(flask.request.data.decode('utf-8'))
    if data['index'] < len(tasks) and data['index'] >= 0:
      save = tasks[data['index']]
      tasks.pop(data['index'])
      active = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
      active.append(save)
      db.set_key(['account_data', get_id(flask.request), 'tasks', 'active'], active)
      db.set_key(['account_data', get_id(flask.request), 'tasks', 'completed'], tasks)
      return {'success': True}
    return {'success': False, 'message': 'Task does not exist'}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/settings/change-password', methods=['POST'])
def api_settings_changepassword():
  if is_authenticated(flask.request, db):
    data = json.loads(flask.request.data.decode('utf-8'))
    if 'email' not in db.get_key(['account_data', get_id(flask.request)]):
      if data['original'] == db.get_key(['account_data', get_id(flask.request), 'password']):
        if data['newPassword'] == data['newPasswordRepeat']:
          if data['newPassword'].strip() != "":
            db.set_key(['account_data', get_id(flask.request), 'password'], data['newPassword'])
            return {'success': True}
          return {'success': False, 'message': 'Password cannot be blank'}
        return {'success': False, 'message': 'Passwords do not match'}
      return {'success': False, 'message': 'Incorrect password'}
    return {'success': False, 'message': "Can't change password for Google signin"}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/settings/delete-account', methods=['POST'])
def api_settings_deleteaccount():
  if is_authenticated(flask.request, db):
    data = db.get_key('account_data')
    del data[get_id(flask.request)]
    db.set_key('account_data', data)
    response = flask.make_response(flask.redirect('/', code=302))
    response.set_cookie('Authorization', '', expires=0)
    return response
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/settings/reset-account', methods=['POST'])
def api_settings_resetaccount():
  if is_authenticated(flask.request, db):
    data = db.get_key(['account_data', get_id(flask.request)])
    data['tasks'] = {'active': [], 'completed': []}
    data['groups'] = []
    db.set_key(['account_data', get_id(flask.request)], data)
    return {'success': True}
  return {'success': False, 'message': 'Unauthorized'}

@app.route('/api/update/task', methods=['POST'])
def api_update_task():
  if is_authenticated(flask.request, db):
    if flask.request.args.get('index'):
      tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
      index = int(flask.request.args.get('index'))
      if index < len(tasks) and index >= 0:
        data = json.loads(flask.request.data.decode('utf-8'))
        if len(data['name']) < 1 or len(data['name']) > 50:
          return {'success': False, 'message': 'Invalid amount of characters'}
        group = None
        if data['group']:
          groups = db.get_key(['account_data', get_id(flask.request), 'groups'])
          group_names = [g['name'] for g in groups]
          if data['group'] not in group_names:
            return {'success': False, 'message': 'Group does not exist'}
          group = groups[group_names.index(data['group'])]
        tasks = db.get_key(['account_data', get_id(flask.request), 'tasks', 'active'])
        tasks[index] = {
          'name': data['name'],
          'group': group,
          'important': data['important']
        }
        db.set_key(['account_data', get_id(flask.request), 'tasks', 'active'], tasks)
        return {'success': True}
      return {'success': False, 'message': 'Task does not exist'}
    return {'success': False, 'message': 'Missing parameter index'}
  return {'success': False, 'message': 'Unauthorized'}

app.run(host='0.0.0.0', port=8080)

