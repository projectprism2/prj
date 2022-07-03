public with sharing class Gate {
    public Gate() {

    }
    
    @AuraEnabled(cacheable=true)
    public static List<Assigned_Gate__c> getAssignedGatesByProject(Id projectId){
        return [SELECT Id,Name,Project__c,Status__c,Gate__r.Name,Gate__r.Sort_Order__c 
                FROM Assigned_Gate__c WHERE Project__c =: projectId
                ORDER BY Gate__r.Sort_Order__c asc];
    }

    @AuraEnabled
    public static void updateAssignedGatesByProject(Id projectId,Id assignedGateId){
        List<Assigned_Gate__c> assignedGates = getAssignedGatesByProject(projectId);
        for(Assigned_Gate__c ag: assignedGates){
            ag.Status__c = 'Completed';

            if(ag.Id == assignedGateId){
                ag.Status__c = 'In Progress';
                break;
            }
        }
        update assignedGates;
    }
}
