public with sharing class ForecastController {

    final static Map<String,String> MONTH_MAP = new Map<String,String>{
        '1' => 'Jan',
        '2' => 'Feb',
        '3' => 'Mar',
        '4' => 'Apr',
        '5' => 'May',
        '6' => 'Jun',
        '7' => 'Jul',
        '8' => 'Aug',
        '9' => 'Sep',
        '10' => 'Oct',
        '11' => 'Nov',
        '12' => 'Dec'
    };

    @AuraEnabled
    public static ProjectVersionWrapper fetchRecords(String recordId){
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
            ProjectVersionWrapper pvw = new ProjectVersionWrapper();
            pvw.forecasts = new List<FinancialWrapper>();
            pvw.aggregators = new List<FinancialWrapper>();
            Integer currentMonth = System.today().month();
            Integer currentYear = System.today().year();

            for(Project_Version__c pv: [SELECT Id, Name, Project__c, Is_Primary__c, //Total_Labour_Forecast__c, Total_Material_Forecast__c, Total_Forecast__c, Total_Material_Cost__c, Total_Resource_Cost__c, 
                                        (Select Id, Name, Year__c, Month__c, Labour__c, Materials__c, Fixed_Costs__c, Total__c, Project_Version__c From Forecasts__r ORDER BY Year__c, Month__c), 
                                        (Select Id, Name, Year__c, Month__c, Material_Expense__c, Labour_Expense__c, Fixed_Expense__c, Total__c, Project_Version__c From Aggregator__r ORDER BY Year__c, Month__c) 
                                        FROM Project_Version__c 
                                        WHERE Id=:versionId ]){
                pvw.projectVersion = pv;
                for(Forecast__c f: pv.Forecasts__r){
                    FinancialWrapper fW = new FinancialWrapper(f.Id, f.Month__c, f.Year__c, f.Labour__c, f.Materials__c, f.Fixed_Costs__c); 
                    fW.headerValue = MONTH_MAP.get(f.Month__c)+'\''+f.Year__c.right(2);
                    fW.disableEdit = Date.newInstance(Integer.valueOf(f.Year__c), Integer.valueOf(f.Month__c), System.today().day()) < System.today();
                    pvw.forecasts.add(fW);
                }
                for(Aggregator__c agg: pv.Aggregator__r){
                    FinancialWrapper aggW = new FinancialWrapper(agg.Id, agg.Month__c, agg.Year__c, agg.Labour_Expense__c, agg.Material_Expense__c, agg.Fixed_Expense__c);
                    aggW.headerValue = MONTH_MAP.get(agg.Month__c)+'\''+agg.Year__c.right(2);
                    aggW.disableEdit = Date.newInstance(Integer.valueOf(agg.Year__c), Integer.valueOf(agg.Month__c), System.today().addMonths(-1).day()) != System.today().addMonths(-1);
                    pvw.aggregators.add(aggW);
                }
            }
            
            return pvw;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<FinancialWrapper> saveForecastRecords(List<FinancialWrapper> forecastList){
        try {
            List<Forecast__c> forecastRecordList = new List<Forecast__c>();
            for(FinancialWrapper fw: forecastList){
                forecastRecordList.add(fw.getAsForecastRecord());
            }
            update forecastRecordList;
            return forecastList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<FinancialWrapper> saveAggregatorRecords(List<FinancialWrapper> aggregatorList){
        try {
            List<Aggregator__c> aggregatorRecordList = new List<Aggregator__c>();
            for(FinancialWrapper fw: aggregatorList){
                aggregatorRecordList.add(fw.getAsAggregatorRecord());
            }
            update aggregatorRecordList;
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
        public String month                            {get; set;}
        @AuraEnabled
        public String year                             {get; set;}
        @AuraEnabled
        public Decimal labourAmount                     {get; set;}
        @AuraEnabled
        public Decimal materialAmount                   {get; set;}
        @AuraEnabled
        public Decimal fixedAmount                      {get; set;}
        @AuraEnabled
        public Decimal total{
            get{
                return (this.labourAmount!= null ? this.labourAmount : 0) +(this.materialAmount!= null ? this.materialAmount : 0) +(this.fixedAmount!= null ? this.fixedAmount : 0) ;
            } set;
        }
        @AuraEnabled
        public boolean disableEdit                      {get; set;}
        @AuraEnabled
        public String headerValue                       {get; set;}

        public FinancialWrapper(){

        }
        public FinancialWrapper(Id recId, String m, String y, Decimal lA, Decimal mA, Decimal fA){
            this.recordId = recId;
            this.month = m;
            this.year = y;
            this.labourAmount = lA;
            this.materialAmount = mA;
            this.fixedAmount = fA;
            this.disableEdit = false;
        }

        public Forecast__c getAsForecastRecord(){
            return new Forecast__c(Id=this.recordId, Labour__c=this.labourAmount, Materials__c=this.materialAmount, Fixed_Costs__c=this.fixedAmount);
        }

        public Aggregator__c getAsAggregatorRecord(){
            return new Aggregator__c(Id=this.recordId, Labour_Expense__c=this.labourAmount, Material_Expense__c=this.materialAmount, Fixed_Expense__c=this.fixedAmount);
        }

    }
}
