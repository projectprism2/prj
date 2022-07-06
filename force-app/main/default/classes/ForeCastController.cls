public with sharing class ForeCastController {

    @AuraEnabled
    public static List<ForeCast__c> fetchRecords(String versionId){
        try {
            System.debug('versionId--'+versionId);
            return [SELECT Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c from ForeCast__c where Project_Version__c=:versionId ORDER BY Name];

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ForeCast__c> saveRecords(List<ForeCast__c> foreCastList){
        try {
            if(!foreCastList.isEmpty()){
                update foreCastList;
            }
            return foreCastList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
