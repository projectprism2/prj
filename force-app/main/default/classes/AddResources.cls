public with sharing class AddResources {
    public AddResources() {

    }

    @AuraEnabled
    public static ResourceWrapper fetchResources(String versionId){
        System.debug('versionId--'+versionId);
        try {
            ResourceWrapper rw = new ResourceWrapper();
            List<FieldWrapper> columns = new List<FieldWrapper>();
            List<String> referenceFields = new List<String>();
            Map<String, String> returnMap = new Map<String,String>();

            List<Schema.FieldSetMember> lstFSMember = 
            Schema.Resource_Engagement__c.getSObjectType().getDescribe().fieldSets.getMap().get('AddResources').getFields();

            //prepare SOQL query based on fieldAPIs	
            String query = 'SELECT ';
            for(Schema.FieldSetMember f : lstFSMember) {
                
                query += f.getFieldPath() + ', ';
                FieldWrapper fw = new FieldWrapper();
                fw.label = f.getLabel();
                fw.fieldName = f.getFieldPath();
                fw.editable = f.getFieldPath().contains('__r')?false:true;
                fw.dataType = String.valueOf(f.getType()).toLowerCase();
                columns.add(fw);
            }
            query += 'Id FROM Resource_Engagement__c where Project_Version__c =:versionId' ;
            List<SObject> lstRecords = Database.query(query);
            returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            rw.records = lstRecords;
            rw.columns = columns;
            system.debug('columns--'+rw.columns);
            system.debug('rw.records--'+rw.records);
            //return JSON.serialize(returnMap);
            return rw;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class ResourceWrapper{
        @AuraEnabled
        public List<FieldWrapper> columns;
        @AuraEnabled 
        public List<Resource_Engagement__c> records;
    }

    public class FieldWrapper{
        @AuraEnabled
        public String label;
        @AuraEnabled 
        public String fieldName;
        @AuraEnabled 
        public Boolean editable;
        @AuraEnabled 
        public String dataType;
    }
}
