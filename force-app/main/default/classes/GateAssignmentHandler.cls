public with sharing class GateAssignmentHandler {
    public GateAssignmentHandler() {

    }
    
    @AuraEnabled(cacheable=true)
    public static List<Assigned_Gate__c> getAssignedGatesByProject(Id projectId){
        return [SELECT Id,Name,Project__c,Status__c,Gate__r.Name,Gate__r.Sort_Order__c 
                FROM Assigned_Gate__c WHERE Project__c =: projectId
                ORDER BY Gate__r.Sort_Order__c asc];
    }

    @AuraEnabled
    public static List<Assigned_Gate__c> updateAssignedGatesByProject(Id projectId,Id gateIdToComplete){
        List<Assigned_Gate__c> assignedGates = getAssignedGatesByProject(projectId);
        Integer noOfGatesAfter = 0;
        for(Assigned_Gate__c ag: assignedGates){
            String currentStatus = ag.Status__c;
            // if(currentStatus == 'In Progress')
            if(noOfGatesAfter < 1){
                ag.Status__c = 'Completed';
                if(ag.Id == gateIdToComplete){
                    noOfGatesAfter = 1;
                    if(currentStatus != 'In Progress'){
                        ag.Status__c = 'In Progress';
                        noOfGatesAfter = 2;
                    }
                }
                if(currentStatus != 'Completed' && ag.Status__c == 'Completed'){
                    ag.Completed_Date__c = System.now();
                }
            }
            else if(noOfGatesAfter == 1){
                ag.Status__c = 'In Progress';
                noOfGatesAfter += 1;
            }
            else{
                ag.Status__c = 'Open';
            }
            if(ag.Status__c != 'Completed'){
                ag.Completed_Date__c = null;
            }
        }
        update assignedGates;
        return assignedGates;
    }
}