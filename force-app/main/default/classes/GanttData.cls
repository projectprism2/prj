/**
 * Created 23.01.2020.
 */

public with sharing class GanttData {

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTasksOld() {
        
        // fetching the Records via SOQL
        // List<GanttTask__c> Tasks = new List<GanttTask__c>();
        // Tasks = [SELECT Id, Name, Start_Date__c, Duration__c, Parent__c FROM GanttTask__c];

        // List<GanttLink__c> Links = new List<GanttLink__c>();
        // Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'tasks' => new List<String>(), 'links' => new List<String>() };
        return result;
   }

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTasks() {
        
        // fetching the Records via SOQL
        List<Resource_Engagement__c> Tasks = new List<Resource_Engagement__c>();
        Tasks = [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c,Number_of_Weekdays__c,Resource__r.Name FROM Resource_Engagement__c];

        // List<GanttLink__c> Links = new List<GanttLink__c>();
        // Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => new List<String>() };
        return result;
   }

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getResourcesByProject(String currentRecordId) {
        String pvId = '';
        List<Resource_Engagement__c> Tasks = new List<Resource_Engagement__c>();
        if(String.isNotBlank(currentRecordId)){
            Id recId = Id.valueOf(currentRecordId);
            String objName = recId.getSObjectType().getDescribe().getName();
            
            if(objName.equalsIgnoreCase('Project_Version__c')){
                pvId = recId;
            }
            else if(objName.equalsIgnoreCase('Project__c')){
                for(Project__c p: [SELECT Id, Name, Active_Version__c FROM Project__c WHERE Id =: recId]){
                    pvId = p.Active_Version__c;
                }
            }
            if(String.isNotBlank(pvId)){
                Tasks = [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c,Number_of_Weekdays__c,Resource__r.Name FROM Resource_Engagement__c WHERE Project_Version__c =:pvId ];
            }
        }
        
        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => new List<String>() };
        return result;
   }

    @AuraEnabled
    public static string createResource(String resourcedata) {
        //Map<String,String> a = (Map<String,String>)resourcedata;
        Map<String,Object> resourceMap = (Map<String,Object>)JSON.deserializeUntyped(resourcedata);
        Resource_Engagement__c resourceEngagement = new Resource_Engagement__c();
        System.debug(resourceMap.get('Start_Date_of_Engagement__c'));
        String startDateEngagement = (String)resourceMap.get('Start_Date_of_Engagement__c');
        resourceEngagement.Start_Date_of_Engagement__c = Date.newInstance(Integer.ValueOf(startDateEngagement.substring(0,4)),Integer.ValueOf(startDateEngagement.substring(5,7)),Integer.ValueOf(startDateEngagement.substring(8,10)));
        //resourceEngagement.End_Date_of_Engagement__c = resourceEngagement.Start_Date_of_Engagement__c.addDays()
        return 'sdsdsd';
   }

}