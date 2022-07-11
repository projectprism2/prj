trigger ProjectTrigger on Project__c (after insert) {
	if(trigger.isInsert){
        if(trigger.isBefore){
            ProjectTriggerHandler.handleBeforeInsert(trigger.new);
        }
        else{
            ProjectTriggerHandler.handleAfterInsert(trigger.newMap);
        }
    }
}