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
            return String.isNotBlank(versionId)?[SELECT Id, Name, Project__c, Is_Primary__c, Total_Labour_Forecast__c, Total_Material_Forecast__c, Total_Forecast__c, Total_Material_Cost__c, Total_Resource_Cost__c, (Select Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c From Forecasts__r ORDER BY Name), (Select Id, Name, Year__c, Month__c, Material_Expense__c, Labour_Expense__c, Fixed_Expense__c, Total__c, Project_Version__c From Aggregator__r ORDER BY Name) FROM Project_Version__c WHERE Id=:versionId ]:new Project_Version__c();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Forecast__c> saveForecastRecords(List<Forecast__c> forecastList){
        try {
            if(!forecastList.isEmpty()){
                update forecastList;
            }
            return forecastList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Aggregator__c> saveAggregatorRecords(List<Aggregator__c> aggregatorList){
        try {
            if(!aggregatorList.isEmpty()){
                update aggregatorList;
            }
            return aggregatorList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class ProjectVersionWrapper{
        @AuraEnabled
        public List<FinancialWrapper> forecasts         {get; set;}
        @AuraEnabled
        public List<FinancialWrapper> aggregators       {get; set;}
        @AuraEnabled
        public Project_Version__c projectVersion        {get; set;}
    }

    public class FinancialWrapper{
        @AuraEnabled
        public id recordId                              {get; set;}
        @AuraEnabled
        public integer month                            {get; set;}
        @AuraEnabled
        public integer year                             {get; set;}
        @AuraEnabled
        public Decimal labourAmount                     {get; set;}
        @AuraEnabled
        public Decimal materialAmount                   {get; set;}
        @AuraEnabled
        public Decimal fixedAmount                      {get; set;}
        @AuraEnabled
        public Decimal total{
            get{
                return this.labourAmount + this.materialAmount + this.fixedAmount;
            } set;
        }
        @AuraEnabled
        public boolean disableEdit                      {get; set;}
        @AuraEnabled
        public String headerValue                       {get; set;}

        public FinancialWrapper(Id recId, Interger m, Integer y, Decimal lA, Decimal mA, Decimal fA){
            this.recordId = recId;
            this.month = m;
            this.year = y;
            this.labourAmount = lA;
            this.materialAmount = mA;
            this.fixedAmount = fA;
            
        }
    }
}
