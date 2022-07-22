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
    @AuraEnabled()
    public static Map<String, Object> getAllResourcesByProject() {
        List<GanttDataWrapper> ganttDataWrapperList = new List<GanttDataWrapper>();
        Set<Id> activeProjectVersionIdSet = new Set<Id>();
        for(Project__c p: [SELECT Id, Project_Name__c, Name, Active_Version__c,Parent_Project__r.Active_Version__c FROM Project__c WHERE Active_Version__c != NULL ORDER BY Project_Name__c]){
            activeProjectVersionIdSet.add(p.Active_Version__c);
            if(p.Parent_Project__r.Active_Version__c!=null){ //parenting sub-projects
                ganttDataWrapperList.add(new GanttDataWrapper('project',p.Active_Version__c,p.Name,null,null,p.Parent_Project__r.Active_Version__c,null));
            }
            else{
                ganttDataWrapperList.add(new GanttDataWrapper('project',p.Active_Version__c,p.Name,null,null,'',null));
            }
        }
        for(Resource_Engagement__c re: [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c, Number_of_Weekdays__c, Hours_Engaged__c, Resource__r.Name, Project_Version__c, Progress__c 
                                        FROM Resource_Engagement__c 
                                        WHERE Project_Version__c IN :activeProjectVersionIdSet ]){
            ganttDataWrapperList.add(new GanttDataWrapper('task',re.Id,re.Resource__r.Name+' ('+Integer.valueOf(re.Number_of_Weekdays__c * re.Hours_Engaged__c)+' hours)',re.Start_Date_of_Engagement__c,re.End_Date_of_Engagement__c, re.Project_Version__c, re.Progress__c));
        }
        Map<String, Object> result = new Map<String, Object>{'tasks' => ganttDataWrapperList, 'links' => new List<String>() };
        return result;
    }

    @AuraEnabled()
    public static Map<String, Object> getAllProjectsByResource() {
        List<GanttDataWrapper> ganttDataWrapperList = new List<GanttDataWrapper>();

        for(Contact con:[SELECT Id,Name,(SELECT Id,Project_Version__c,Start_Date_of_Engagement__c,End_Date_of_Engagement__c,
                         Project_Version__r.Project__r.Id,Project_Version__r.Project__r.Project_Name__c, Project_Version__r.Project__r.Name, Number_of_Weekdays__c, Hours_Engaged__c from Resource_Engagements__r)
                         FROM Contact
                         WHERE Id IN (SELECT Resource__c from Resource_Engagement__c)]){

            ganttDataWrapperList.add(new GanttDataWrapper('project',con.Id,con.Name,null,null,'',null));
                for(Resource_Engagement__c re : con.Resource_Engagements__r){
                    for(Project__c pro : re.Project_Version__r.Project__r){
                        System.debug(pro.id+' '+pro.Project_Name__c+'  '+con.Id);
                        ganttDataWrapperList.add(new GanttDataWrapper('task',re.Id,pro.Name+' ('+Integer.valueOf(re.Number_of_Weekdays__c * re.Hours_Engaged__c)+' hours)',re.Start_Date_of_Engagement__c,re.End_Date_of_Engagement__c,con.Id,null));
                    }
                }
        }
        Map<String, Object> result = new Map<String, Object>{'tasks' => ganttDataWrapperList, 'links' => new List<String>() };
        return result;
    }

    @AuraEnabled()
    public static Map<String, Object> getProjectsByResource(String currentRecordId) {
        List<GanttDataWrapper> ganttDataWrapperList;
        if(String.isNotBlank(currentRecordId)){
            ganttDataWrapperList = new List<GanttDataWrapper>();
            Id recId = Id.valueOf(currentRecordId);
            String objName = recId.getSObjectType().getDescribe().getName();
            
            if(objName.equalsIgnoreCase('Project__c')){
                Id projectId = recId;
                for(Contact con:[SELECT Id,Name,(SELECT Id,Project_Version__c,Start_Date_of_Engagement__c,End_Date_of_Engagement__c,Project_Version__r.Project__r.Id,Project_Version__r.Project__r.Project_Name__c, Project_Version__r.Project__r.Name, Number_of_Weekdays__c, Hours_Engaged__c from Resource_Engagements__r)
                         FROM Contact
                         WHERE Id IN (SELECT Resource__c from Resource_Engagement__c)]){
                    
                    ganttDataWrapperList.add(new GanttDataWrapper('project',con.Id,con.Name,null,null,'',null));  
                    for(Resource_Engagement__c re : con.Resource_Engagements__r){
                        for(Project__c pro : re.Project_Version__r.Project__r){
                            System.debug(pro.id+' '+pro.Project_Name__c+'  '+con.Id);
                            if(pro.Id == projectId){
                                ganttDataWrapperList.add(new GanttDataWrapper('task',re.Id,pro.Name+' ('+Integer.valueOf(re.Number_of_Weekdays__c * re.Hours_Engaged__c)+' hours)',re.Start_Date_of_Engagement__c,re.End_Date_of_Engagement__c,con.Id,null));
                            }
                        }
                    }
                 }
            }

            else if(objName.equalsIgnoreCase('Project_Version__c')){
                ganttDataWrapperList = new List<GanttDataWrapper>();
                Id projectVId = recId;
                // why were we querying Projects to Deliver? @vikaspatil7
                for(Contact con:[SELECT Id,Name,(SELECT Id,Project_Version__c, Project_Version__r.Project__c, Project_Version__r.Project__r.Name, Project_Version__r.Is_Primary__c, Start_Date_of_Engagement__c,End_Date_of_Engagement__c from Resource_Engagements__r)
                                FROM Contact
                                WHERE Id IN (SELECT Resource__c from Resource_Engagement__c)]){

                    ganttDataWrapperList.add(new GanttDataWrapper('project',con.Id,con.Name,null,null,'',null));
                    for(Resource_Engagement__c re : con.Resource_Engagements__r){
                        if(re.Project_Version__r.Is_Primary__c){
                            ganttDataWrapperList.add(new GanttDataWrapper('task',re.Project_Version__r.Project__c,re.Project_Version__r.Project__r.Name+' ('+Integer.valueOf(re.Number_of_Weekdays__c * re.Hours_Engaged__c)+' hours)',re.Start_Date_of_Engagement__c,re.End_Date_of_Engagement__c,con.Id,null));
                        }
                    }
                }
            }
        }
        Map<String, Object> result = new Map<String, Object>{'tasks' => ganttDataWrapperList, 'links' => new List<String>() };
        return result;
    }

    @RemoteAction
    @AuraEnabled()
    public static Map<String, Object> getResourcesByProject(String currentRecordId) {
        String pvId = '';
        List<Resource_Engagement__c> resourceEngagements = new List<Resource_Engagement__c>();
        List<GanttDataWrapper> ganttDataWrapperList = new List<GanttDataWrapper>();
        if(String.isNotBlank(currentRecordId)){
            Id recId = Id.valueOf(currentRecordId);
            String objName = recId.getSObjectType().getDescribe().getName();
            
            if(objName.equalsIgnoreCase('Project_Version__c')){
                pvId = recId;
                for(Project_Version__c pv: [SELECT Id, Name FROM Project_Version__c WHERE Id =: pvId]){
                    ganttDataWrapperList.add(new GanttDataWrapper('project',pv.Id,pv.Name,null,null,'',null));
                }
            }
            else if(objName.equalsIgnoreCase('Project__c')){
                for(Project__c p: [SELECT Id, Project_Name__c, Name, Active_Version__c FROM Project__c WHERE Id =: recId AND Active_Version__c != NULL]){
                    pvId = p.Active_Version__c;
                    ganttDataWrapperList.add(new GanttDataWrapper('project',pvId,p.Project_Name__c,null,null,'',null));
                }
            }
            else{
                // Show all projects and its resources
            }
            if(String.isNotBlank(pvId)){
                resourceEngagements = [SELECT Id, Name, Start_Date_of_Engagement__c, End_Date_of_Engagement__c, Engaged_Days__c, Number_of_Weekdays__c, Hours_Engaged__c, Resource__r.Name, Project_Version__c, Progress__c FROM Resource_Engagement__c WHERE Project_Version__c =:pvId ];
                for(Resource_Engagement__c re: resourceEngagements){
                    ganttDataWrapperList.add(new GanttDataWrapper('task',re.Id,re.Resource__r.Name+' ('+Integer.valueOf(re.Number_of_Weekdays__c * re.Hours_Engaged__c)+' hours)',re.Start_Date_of_Engagement__c,re.End_Date_of_Engagement__c, re.Project_Version__c, re.Progress__c));
                }
            }
        }
        
        Map<String, Object> result = new Map<String, Object>{'tasks' => ganttDataWrapperList, 'links' => new List<String>() };
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