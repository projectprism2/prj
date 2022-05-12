trigger ProjectVersionTrigger on Project_Version__c (before insert) {
    if(trigger.isInsert && trigger.isBefore){
        ProjectVersionTriggerHandler.handleBeforeInsert(trigger.new);
    }
}