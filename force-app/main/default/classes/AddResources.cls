public with sharing class AddResources {
    @AuraEnabled
    public static ResourceWrapper fetchResources(String recordId){
        try {
            String objectName = ((Id)recordId).getSObjectType().getDescribe().getName();
            String versionId = objectName=='Project__c'? [select Active_Version__c from Project__c where Id=:recordId].Active_Version__c : recordId;

            ResourceWrapper rw = new ResourceWrapper();
            List<FieldWrapper> columns = new List<FieldWrapper>();

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
            rw.records = lstRecords;
            rw.columns = columns;
            rw.versionId = versionId;

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
        @AuraEnabled 
        public String versionId;

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
