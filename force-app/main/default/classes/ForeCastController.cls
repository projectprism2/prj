public with sharing class ForecastController {

    @AuraEnabled
    public static List<Forecast__c> fetchRecords(String recordId){
        try {
            System.debug('recordId--'+recordId);
            String objectName = ((Id)recordId).getSObjectType().getDescribe().getName();
            String versionId = objectName=='Project__c'? [select Active_Version__c from Project__c where Id=:recordId].Active_Version__c : recordId;
            return [SELECT Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c from Forecast__c where Project_Version__c=:versionId ORDER BY Name];

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
