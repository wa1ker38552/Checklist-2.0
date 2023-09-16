
# get user id
def get_id(request):
  return request.cookies.get('Authorization').split('.')[0]

# get user authentication -> true, false
def is_authenticated(request, db):
  return request.cookies.get('Authorization') and get_id(request) in db.get_key('account_data')