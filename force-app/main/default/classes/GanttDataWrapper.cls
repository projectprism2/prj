public class GanttDataWrapper{
    @AuraEnabled
    public String identifier;

    @AuraEnabled
    public String displayLabel;
    
    @AuraEnabled
    public String type;

    @AuraEnabled
    public Date startDate;

    @AuraEnabled
    public Date endDate;

    @AuraEnabled
    public String parentIdentifier;

    @AuraEnabled
    public Decimal progress;

    public GanttDataWrapper(String i, String l, Date sD, Date eD, String pId, Decimal prgs){
        this.identifier = i;
        this.displayLabel = l;
        this.startDate = sD;
        this.endDate = eD;
        this.parentIdentifier = pId;
        this.progress = prgs;
    }

    public GanttDataWrapper(String type, String i, String l, Date sD, Date eD, String pId, Decimal prgs){
     this.type = type;
     this.identifier = i;
     this.displayLabel = l;
     this.startDate = sD;
     this.endDate = eD;
     this.parentIdentifier = pId;
     this.progress = prgs;
    }
}
