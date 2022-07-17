public with sharing class ForecastController {

    @AuraEnabled
    public static Project_Version__c fetchRecords(String recordId){
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
            return String.isNotBlank(versionId)?[SELECT Id, Name, Total_Labour_Forecast__c, Total_Material_Forecast__c, Total_Forecast__c, (Select Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c From Forecasts__r ORDER BY Name) FROM Project_Version__c WHERE Id=:versionId ]:new Project_Version__c();
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
