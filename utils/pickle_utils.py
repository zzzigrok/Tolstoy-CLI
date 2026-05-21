import pickle

class RestrictedUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        raise pickle.UnpicklingError(f"Global '{module}.{name}' is forbidden for security reasons")

def safe_pickle_load(file):
    return RestrictedUnpickler(file).load()
