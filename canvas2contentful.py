from canvasapi import Canvas
import contentful_management
import html2markdown
import pandas as pd

from contentful_mapping import Translate
import secure


class canvas2contentful(object):
    def __init__(self):
        # initial Contentful Mgmt API
        self.client = contentful_management.Client(secure.ACCESS_TOKEN)
        self.entries_client = self.client.entries(secure.SPACE_ID, secure.ENVIRONMENT_ID) 
        self.T = Translate()

    def create_courseware(self, record):                
        # clean the course record
        if record['syllabus_body']:
            record['syllabus_body'] = self._convert2markdown(record['syllabus_body'])[0:49999]
        else:
            record['syllabus_body'] = ''
        record['url'] = 'https://mit.test.instructure.com/courses/' + str(record['id'])
        record['id'] = str(record['id'])
        
        # Create teachers when handling a new courseware
        teacher_entries = []
        for t in record['teachers']:
            teacher_entries.append(self._create_teacher(t))

        # Create subaccount / department if does not exist
        department = self._create_department(record['account'])

        metadata = self._prepare_metadata(
            record, 
            delete_fields= ['teachers', 'uuid'],
            additional_metadata={
                u'teachers': teacher_entries,
                u'department': department,
            },
        )
        courseware = self.T.create_entry('courseware', record['uuid'], metadata)
        return courseware

    def _create_teacher(self, record):
        metadata = self._prepare_metadata(
            record,
            delete_fields=['id', 'html_url', 'pronouns'],
            additional_metadata={},
        )
        return self.T.create_entry('teacher', record['id'], metadata)

    def _create_department(self, record):
        metadata = self._prepare_metadata(
            record,
            delete_fields=[
                'default_group_storage_quota_mb',
                'default_storage_quota_mb',
                'default_time_zone',
                'default_user_storage_quota_mb',
                'integration_id',
                'parent_account_id',
                'root_account_id',
                'uuid',
                'workflow_state',
            ],
            additional_metadata={},
        )
        return self.T.create_entry('department', record['id'], metadata)

    def create_page(self, record, latest_revision_record):
        record['body'] = self._convert2markdown(latest_revision_record['body'])
        record['revision_id'] = latest_revision_record['revision_id']
        metadata_keys = ['title', 'page_id', 'updated_at', 'html_url', 'body', 'revision_id']
        delete_everything_else = [k for k in record if k not in metadata_keys]

        metadata = self._prepare_metadata(
            record,
            delete_fields=delete_everything_else,
            additional_metadata={},
        )
        return self.T.create_entry('page', record['page_id'], metadata)

    def create_assignment(self, record):
        # Specify keys aligned with Contentful content model (i.e., metadata_keys should match content model)
        metadata_keys = [
            'id', 'description', 'due_at', 'points_possible', 'grading_type', 
            'created_at', 'updated_at', 'course_id', 'name', 'html_url', 
        ]
        
        record['id'] = str(record['id'])
        record['course_id'] = str(record['course_id'])
        record['uid'] = record['course_id'] + '_' + record['id']
        record['description'] = self._convert2markdown(record['description'])
        
        # create list to specify removal of all keys not listed above in metadata_keys
        delete_everything_else = [k for k in record if k not in metadata_keys]

        metadata = self._prepare_metadata(
            record,
            delete_fields=delete_everything_else,
            additional_metadata={},
        )
        return self.T.create_entry('assignment', record['uid'], metadata)

    def add_pages(self, canvas_course_object, courseware, published=True):
        canvas_pages = [p for p in canvas_course_object.get_pages() if p.__dict__['published']==published]
        page_entries = []
        for p in canvas_pages:
            page_entries.append(C2C.create_page(p.__dict__, p.show_latest_revision().__dict__)) 

        courseware.pages = page_entries
        return courseware.save()

    def add_assignments(self, canvas_course_object, courseware, published=True):
        canvas_assignments = [a for a in canvas_course_object.get_assignments() if a.__dict__['published']==True]
        assignment_entries = []
        for a in canvas_assignments:
            assignment_entries.append(C2C.create_assignment(a.__dict__))

        courseware.assignments = assignment_entries
        return courseware.save()

    def _convert2markdown(self, html_string):
        return html2markdown.convert(html_string) if html_string else None

    def _prepare_metadata(self, record, delete_fields=None, additional_metadata=None):
        metadata = dict((k,record[k]) for k in record.keys() if isinstance(record[k], str)==True)
        if delete_fields:
            for k in delete_fields:
                if k in metadata:
                    del metadata[k]
        
        if additional_metadata:
            metadata.update(additional_metadata)

        return metadata


if __name__ == '__main__':

    course_ids = [
        4637, #	8.701 Intro: Nuclear & Particle Phys
        4475, # 6.912 Engineering Leadership
        3241, # 10.495 Design & Dvpmt Immunotherapies
        4164, #	3.24 Structure of Materials
        3919, #	21H.343 Bookmaking Renaissance & Today
        5182, # 15.351_FA20 Intro to Making (google slides, pages are summaries of resources, no assignments)
    ]


    course_ids = [
        5329  # This is Daniels/Jean-Michels temporary sandbox on mit.instructure.com
    ]

    canvas = Canvas(secure.API_URL, secure.API_KEY)
    C2C = canvas2contentful()
    

    for course_id in course_ids: #course_ids[:1]:
        # get Canvas course object
        include_meta = ['account', 'syllabus_body', 'updated_at', 'teachers']
        canvas_course_object = canvas.get_course(course_id, include=include_meta)    
        
        # create record aligned with Contentful content model (i.e., metadata_keys should match content model)
        metadata_keys = include_meta + ['id', 'name', 'course_code', 'created_at', 'default_view', 'uuid']
        course_record = {k: canvas_course_object.__dict__[k] for k in metadata_keys + include_meta}    

        # create courseware in Contentful
        courseware = C2C.create_courseware(course_record)

        # Add pages to courseware
        C2C.add_pages(canvas_course_object, courseware, published=True)

        # Add assignments to courseware
        C2C.add_assignments(canvas_course_object, courseware, published=True)
