trigger AssignedGateTrigger on Assigned_Gate__c (before insert) {
    if(trigger.isInsert){
        if(trigger.isBefore){
            AssignedGateTriggerHandler.handleBeforeInsert(trigger.new);
        }
        else{
            AssignedGateTriggerHandler.handleAfterInsert(trigger.newMap);
        }
    }
}