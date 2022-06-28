trigger ProjectVersionTrigger on Project_Version__c (before insert, after insert) {
    if(trigger.isInsert){
        if(trigger.isBefore){
            ProjectVersionTriggerHandler.handleBeforeInsert(trigger.new);
        }
        else{
            ProjectVersionTriggerHandler.handleAfterInsert(trigger.newMap);
        }
    }
}