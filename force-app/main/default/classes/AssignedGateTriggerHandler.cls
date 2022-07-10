public with sharing class AssignedGateTriggerHandler {
    /* this method is called from before insert Assigned Gate trigger */
    public static void handleBeforeInsert(List<Assigned_Gate__c> newRecords){
        handleUniqueAssignedGateToProject(newRecords);
    }
    
    /* this method is called from after insert Assigned Gate trigger */
    public static void handleAfterInsert(Map<Id,Assigned_Gate__c> newRecordsMap){
        
    }

    public static void handleUniqueAssignedGateToProject(List<Assigned_Gate__c> assignedGates){
        try{
            for(Assigned_Gate__c ag:assignedGates){
                ag.Gate_Id_And_Project_Id__c = ag.Gate__c +'-'+ag.Project__c;
            }
        }
        catch(Exception e){
            System.debug('Exception occurred while handling unique Gate to a Project : '+e.getMessage());
            throw e;
        }
    }
}
