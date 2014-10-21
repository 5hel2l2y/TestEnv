/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Toolkit = {
    contains : function() {
        //_.keys(object)
        //_.find(list, predicate - testFn)
    }
};

function GridView(data, options){
    //Dependency Check
    if(typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        console.error('Gridview: Underscore JS  (http://underscorejs.org/) and jQuery are required.');
        return;
    }
    
    //Required param check
    if( typeof data === 'undefined' || !_.isArray(data) || (data.hasOwnProperty[0] && !_.isObject(data[0])) ) {
        console.error('Gridview: Expected first param to be array of objects.');
        return;
    }
    
    //Allow options to be optional
    options = typeof options === 'undefined' ? {} : options;
    
    var gv = {
        data : data,
        currPage : 1,
        options : null,
        cols : [],
        
        /**
         * Sets this.options to hard-coded defaults
         * @returns void
         */
        _resetOptions : function(){
            this.options = {
                isPaginated : false,
                pageSize : 20,
                sortCol : '',
                sortDirections : 'ASC',
                legend : '',
                klass : '',
                style : '',
                additionalCols : [],
                blackList : []
            };
        },
        
        /**
         * Copies user-defined options over to this.options
         * @param {Object} options List of options
         * @returns void
         */
        _loadOptions : function(options){
            if (_.isNull(this.options)) this._resetOptions();
            if(!_.isObject(options)) {
                console.error('Gridview._loadOptions: Expected object, given ' + typeof options);
                return;
            }
            
            for( var i in this.options) {
                if(!options.hasOwnProperty(i)) continue;
                if(i === 'pageSize' && options[i] < 1) {
                    console.error('GridView._loadOptions: pageSize must be greater than 1.');
                } else {
                    this.options[i] = options[i];
                }
            }
            
        },
        refresh : function(){}, //need to give option to update options after create
        
        _init : function(options){
            this._loadOptions(options);
            this.cols =_.keys(this.data[0]);
            
            if(this.options.sortCol) this.sortByColumn();
        },
        
        sortByColumn : function(){},
        
        create : function(){
            this.table = jQuery('<table style="border:1px solid pink;"><thead></thead><tbody></tbody></table>');
            this._tableHeader();
            this._tableBody();
            if(this.options !== null && this.options.isPaginated()) this._nav();
            
            return this.table;
        },
        _tableHeader : function(){
            
        },
        /**
         * Table Body Stuff
         * @return {[type]} [description]
         * 
         * @author Sherry Yang
         */
        _tableBody : function(){
          console.log(options.blackList);


          var table = this.table;
          for(var i = 0; i < this.data.length; i++) {
            console.log(this.data[i]);
            table.append($('<tr>'));
            var valArray = _.values(this.data[i]);
            $.each(valArray, function(index, value) {
              // table.append(
              //   $('<tr>').append(
              //     $('<td style="border:1px solid pink;">').text(value)));

              table.find('tr').each(function() {
                var tRow = $(this);
                tRow.append('<td style="border:1px solid pink;">' + value + '</td>');
              });
            });
          };
        },
        _nav : function(){},
        updatePage : function(){},
        
        next : function(){},
        previous : function(){},
        goTo : function(){},
        doSort : function(){}
    };
    
        nav = function(){};
    
    // init.call(gv);
    return gv;
}