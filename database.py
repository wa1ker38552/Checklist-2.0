import json


class Database:
  def __init__(self, path: str):
    self.path: str = path

  def load(self) -> dict:
    with open(self.path, 'r') as file:
      return json.loads(file.read())

  def save(self, data: dict, indent: int = 2):
    with open(self.path, 'w') as file:
      file.write(json.dumps(data, indent=indent))

  def get_key(self, keys: str | list[str]):
    data = self.load()
    if isinstance(keys, str):
      return data[keys]
    else:
      expression = f'''data{"".join([f"['{k}']" for k in keys])}'''
      return eval(expression)

  def set_key(self, keys: str | list[str], value):
    data = self.load()
    if isinstance(keys, str):
      data[keys] = value
    else:
      expression = f'''data{"".join([f"['{k}']" for k in keys])} = {f"'{value}'" if isinstance(value, str) else value}'''
      exec(expression)
    self.save(data)

  def delete_key(self, keys: str | list[str]):
    data = self.load()
    if isinstance(keys, str):
      del data[keys]
    else:
      expression = f'''del data{"".join([f"['{k}']" for k in keys])}'''
      exec(expression)
    self.save(data)
