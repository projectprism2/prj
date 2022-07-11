public with sharing class ProjectTriggerHandler {
    
    /* this method is called from before insert Project trigger */
    public static void handleBeforeInsert(List<Project__c> newProjects){
    
    }
    
    /* this method is called from after insert Project trigger */
    public static void handleAfterInsert(Map<Id,Project__c> newProjectsMap){
        
        List<Assigned_Gate__c> assignGateList = new List<Assigned_Gate__c>();
        List<Gate__c> gateList = [SELECT Id, Name, Sort_Order__c FROM Gate__c ORDER BY Sort_Order__c ASC];
        for(Id projectId: newProjectsMap.keyset()){
            for(Gate__c gate: gateList){
               assignGateList.add(new Assigned_Gate__c(Name=gate.Name, Gate__c=gate.Id, Project__c=projectId));
            }
        }
        
        if(!assignGateList.isEmpty()){
            insert assignGateList;
        }
        
    }
    
}