public class prism_ganttChartUtil {
    public static String getQueryStartString(String queryFields) {
        String queryStart='SELECT ';
        if(!(queryFields.startsWithIgnoreCase('Id,') || queryFields.containsIgnoreCase(',Id,') || queryFields.endsWithIgnoreCase(',Id'))){
            queryStart += 'Id,';
        }
        if(!(queryFields.startsWithIgnoreCase('name,') || queryFields.containsIgnoreCase(',name,') || queryFields.endsWithIgnoreCase(',name'))){
            queryStart += 'Name,';
        }
        return queryStart;
    }
    
    public static list<objectWrapper> getFields(list<String> objectTypes){
        list<Schema.DescribeSobjectResult> results = new list<Schema.DescribeSobjectResult>();
        list<objectWrapper> objs=new list<objectWrapper>();
        list<String> allowedFields=new list<String>{''};
        try {
           // Make the describe call
            results = Schema.describeSObjects(objectTypes);
            System.debug('Got describe information for ' + results.size() + ' sObjects.');
            // For each returned result, get some info
            for(Schema.DescribeSobjectResult res : results) {
                objectWrapper obj=new objectWrapper();
                obj.fields=new list<fieldsWrapper>();
                list<Schema.DisplayType> allowedFldTypes= new list<Schema.DisplayType>{Schema.DisplayType.anytype, Schema.DisplayType.Currency, Schema.DisplayType.MultiPicklist};
                obj.api=res.getName();
                obj.label=res.getLabel();
                for(String fiedName : res.fields.getMap().keySet()){
                    //if( allowedFldTypes.contains(f.getType()) ) {
                        Schema.DescribeFieldResult f = res.fields.getMap().get(fiedName).getDescribe();
	                     
                        fieldsWrapper fld= new fieldsWrapper();
                        fld.label =  f.getLabel() ;
                        fld.type =  (String.valueOf(f.getType())).toLowercase();
                        fld.api=  f.getName();
                        /*list<Schema.PicklistEntry> options = f.getPicklistValues();
                        if(fld.type.containsIgnoreCase('picklist') && options!=null && options.size()>0 ){
                            //fld.type = f.isRestrictedPicklist()==true? 'picklist': 'multipicklist';
                            for(Schema.PicklistEntry option:options){
                                fld.options.add(option.getLabel());
                            }
                        }*/
                        if(fld.type=='reference'){
                            fld.relationship=f.getRelationshipName(); 
                            fld.fieldObjectApi=((f.getReferenceTo())[0]).getDescribe().getName();
                        }
                        obj.fields.add(fld);
                    //}
                    
                }
               /* System.debug('sObject Label: ' + res.getLabel());
                System.debug('Number of fields: ' + res.fields.getMap().size());
                System.debug(res.isCustom() ? 'This is a custom object.' : 'This is a standard object.');
                // Get child relationships
                Schema.ChildRelationship[] rels = res.getChildRelationships();
                if (rels.size() > 0) {
                    System.debug(res.getName() + ' has ' + rels.size() + ' child relationships.');
                }*/
                objs.add(obj);
            } 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return objs;
    }
    Public class objectWrapper{
        Public String label;
        Public String api;
        Public list<fieldsWrapper> fields;
        Public String filterLogic;
        Public list<String> conditions;
        Public list<String> apiConditions;
        
    }
    Public class fieldsWrapper{
        Public String label;
        Public String api;
        Public String value;
        Public String id;
        Public list<String> options= new list<String>();
        Public String type;
        Public String fieldObjectApi; // if type is reference
        Public String relationship; // if type is reference
    }
    
}