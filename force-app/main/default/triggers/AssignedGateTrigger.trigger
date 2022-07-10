trigger AssignedGateTrigger on Assigned_Gate__c (before insert,before update) {
    if(trigger.isInsert || trigger.isUpdate){
        if(trigger.isBefore){
            AssignedGateTriggerHandler.handleBeforeInsert(trigger.new);
        }
        else{
            AssignedGateTriggerHandler.handleAfterInsert(trigger.newMap);
        }
    }
}