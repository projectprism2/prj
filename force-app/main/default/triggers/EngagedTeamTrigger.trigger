trigger EngagedTeamTrigger on Engaged_Team__c (before insert) {
    if(trigger.isInsert){
        if(trigger.isBefore){
            EngagedTeamTriggerHandler.handleBeforeInsert(trigger.new);
        }
        else{
            EngagedTeamTriggerHandler.handleAfterInsert(trigger.newMap);
        }
    }
}