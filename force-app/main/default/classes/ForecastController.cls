public with sharing class ForecastController {

    @AuraEnabled
    public static List<Forecast__c> fetchRecords(String recordId){
        try {
            System.debug('recordId--'+recordId);
            String objectName = ((Id)recordId).getSObjectType().getDescribe().getName();
            String versionId = '';
            if(objectName=='Project__c'){
                for(Project__c p: [SELECT Id, Active_Version__c FROM Project__c WHERE Id=:recordId]){
                    versionId = p.Active_Version__c;
                }
            }
            else{
                versionId = recordId;
            }
            return String.isNotBlank(versionId)?[SELECT Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c FROM Forecast__c WHERE Project_Version__c=:versionId ORDER BY Name]:new List<Forecast__c>();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Forecast__c> saveRecords(List<Forecast__c> forecastList){
        try {
            if(!forecastList.isEmpty()){
                update forecastList;
            }
            return forecastList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
