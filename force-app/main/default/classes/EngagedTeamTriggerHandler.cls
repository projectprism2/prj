public with sharing class EngagedTeamTriggerHandler {
    /* this method is called from before insert Engaged Team trigger */
    public static void handleBeforeInsert(List<Engaged_Team__c> newRecords){
        Set<Id> projectVersionIdSet = new Set<Id>();
        Set<Id> teamIdSet = new Set<Id>();
        
        for(Engaged_Team__c et: newRecords){
            projectVersionIdSet.add(et.Project_Version__c);
            teamIdSet.add(et.Team__c);
        }
        Map<Id,Project_Version__c> projectVersionMap = new Map<Id,Project_Version__c>([SELECT Id, Name FROM Project_Version__c WHERE Id IN: projectVersionIdSet]);
        Map<Id,Team__c> teamMap = new Map<Id,Team__c>([SELECT Id, Name FROM Team__c WHERE Id IN: teamIdSet]);
    	for(Engaged_Team__c et: newRecords){
            //update name field
            if(projectVersionMap.containsKey(et.Project_Version__c) && teamMap.containsKey(et.Team__c)){
                et.Name = projectVersionMap.get(et.Project_Version__c).Name+' - '+teamMap.get(et.Team__c).Name;
            }
            else{
                et.Name = et.Project_Version__c + ' - ' + et.Team__c;
            }
        }
    }
    
    /* this method is called from after insert Engaged Team trigger */
    public static void handleAfterInsert(Map<Id,Engaged_Team__c> newRecordsMap){
    
    }
}