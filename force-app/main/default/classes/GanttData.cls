/**
 * Created 23.01.2020.
 */

public with sharing class GanttData {

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTasksOld() {
        
        // fetching the Records via SOQL
        List<GanttTask__c> Tasks = new List<GanttTask__c>();
        Tasks = [SELECT Id, Name, Start_Date__c, Duration__c, Parent__c FROM GanttTask__c];

        List<GanttLink__c> Links = new List<GanttLink__c>();
        Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => Links };
        return result;
   }

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTasks() {
        
        // fetching the Records via SOQL
        List<Resource_Engagement__c> Tasks = new List<Resource_Engagement__c>();
        Tasks = [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c,Number_of_Weekdays__c,Resource__r.Name FROM Resource_Engagement__c];

        List<GanttLink__c> Links = new List<GanttLink__c>();
        Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => Links };
        return result;
   }

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getResourcesByProject(string pvId) {
        
        // fetching the Records via SOQL
        List<Resource_Engagement__c> Tasks = new List<Resource_Engagement__c>();
        Tasks = [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c,Number_of_Weekdays__c,Resource__r.Name FROM Resource_Engagement__c WHERE Project_Version__c =:pvId ];

        List<GanttLink__c> Links = new List<GanttLink__c>();
        Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'tasks' => Tasks, 'links' => Links };
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