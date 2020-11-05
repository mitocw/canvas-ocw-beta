'''
Stores the content model mappings we populate with OCW content.
'''
import contentful_management

import secure


class Translate(object):
    def __init__(self):
        '''
        Must be called with a department already set.
        '''        
        self.client = contentful_management.Client(secure.ACCESS_TOKEN)
        self.entries_client = self.client.entries(secure.SPACE_ID, secure.ENVIRONMENT_ID)
        self.content_types_client = self.client.content_types(secure.SPACE_ID, secure.ENVIRONMENT_ID)
    
    def create_entry(self, content_type_name, entry_uid, entry_attributes, test=False):
        """
        Return a Contentful Entry from OCW input data. If entry exists, returns Entry without creating or updating.   
        For non-existent Entries, metadata are added based on their types and found in the _set_field_type function.
        unicode: text field
        contentful class: single reference field
        list: multi-reference field
        
        Naming conventions required for entry_uid (Contentful UUID must exclude certain characters)

        When calling create_entry(), provide the following parameters:

        :param content_type_name: str used to identify Contentful content_type. Convention: {content_type_name}_type.
        :param entry_uid: the entry's unique Contentful ID (must exclude certain characters).
        :param entry_attributes: dict containing metadata that will be mapped to Contentful.
        :return: Contentful Entry object.
        """

        # Return the entry if the entry_uid already exists in Contentul 
        try:
            return self.entries_client.find(entry_uid)
        except:
            # print(type(content_type_name), type(str(entry_uid.encode)))
            print("Creating {}: {}".format(content_type_name, entry_uid))
        
        payload = {
            'content_type_id': content_type_name,
            'fields': {self.to_camel_case(e): self._set_field_type(v) for e,v in iter(entry_attributes.items())}
        }

        # Create the entry, which returns the Contentful object
        return self.entries_client.create(entry_uid, payload)

    def _set_field_type(self, v):
        if isinstance(v, str):
            return self._text_field(v)
        elif isinstance(v, contentful_management.entry.Entry):
            return self._single_reference_field(v.sys['id'])
        elif isinstance(v, list):
            return self._multi_reference_field([l.sys['id'] for l in v if l])
        else:
            return None

    def _text_field(self, value):
        if value!='':
            return {'en-US': value}
        else:
            return None
    
    def _single_reference_field(self, value):
        return {'en-US': self._sys_field(value)}
    
    def _multi_reference_field(self, list_values):
        return {'en-US': [self._sys_field(v) for v in list_values]}
    
    def _sys_field(self, cid):
        '''
        param cid: contentful id
        '''
        return {'sys': {'type': 'Link', 'linkType': 'Entry', 'id': cid}}

    def to_camel_case(self, string):
        components = string.replace('-','_').split('_')
        return components[0] + ''.join(x.title() for x in components[1:])
    

if __name__ == "__main__":
    from pprint import pprint

    # Translation of metadata to a Contentful entry
    T = Translate()
    payload = {
        'name': 'Test Course', 
        'id': '12345', 
        'url': 'test.canvas.com',
    }
    pprint(
        T.create_entry(
            'Test', 'courseware', payload, test=True
        )
    )
