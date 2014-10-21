var scores = [84, 99, 91, 65, 87, 55, 72, 68, 95, 42], 
		topScorers = [], scoreLimit = 90;
 
topScorers = _.select(scores, function(score){ return score > scoreLimit;});
 
console.log('test _.select..');
console.log(topScorers);
console.log('done test.');

function Gridview(data) {
  if(typeof data === 'undefined') {
    console.error('toolkit.gridview requires data to work (first param left undefined)');
    return;
  }
  if(!_.isArray(data)) {
    console.error('toolkit.gridview expects first parameter to be an array, given: '+toolkit.getPrototype(data));
    return;
  }
  if(!_.isObject(data[0])) {
    console.error('toolkit.gridview expects first parameter to be array of objects, given array of '+toolkit.getPrototype(data[0]));
    return;
  }

  this.init = function() {
    return $('<table class="table table-striped"></table>');
  }

  this.headers = function() {
    var headers;
    _.map(data, function(obj) {
      console.log(_.omit(obj, 'Id'));
      var objData = _.omit(obj, 'Id');
      headers = _.keys(objData);
    });

  }

  // var templStr = "<tr><td><%=value%></td></tr>";
  // console.log(_.template("<tr><td><%=this.thing%></td></tr>", {variable: 'this'}({thing:'confused'})));

  // var rows = _.map(testData, function(item) {
  //   console.log(_.template(templ, {value: item}));
  //   return _.template(templ, {value: item}); 
  // });
  // console.log(rows);
  // var html = rows.join('');
  // $('#mytable').empty().append(html);

  var stuff = "<tr><td><%=item%></td></tr>";
  var rows = _.map(data, function(Id) {
    console.log(data, Id}));
    return _.template(stuff, {value: item}); 
  });
  // var row = _.template(stuff, data);
  $('#mytable').empty().append(rows);
  

  // var data = data;
      // cols = [],
      // currPage = 1,
      // options = null,
      // defaults = {
      //   isPaginated     :   false,
      //   pageSize        :   20,
      //   sortCol         :   "",
      //   sortDirection   :   "ASC",
      //   id              :   "",
      //   legend          :   "",
      //   additionalCols  :   {},
      //   "class"         :   "",
      //   style           :   "",
      //   blackList       :   []
      // };

  this.create = function() {
    var table = this.init();
    var headers = this.headers();
    var html;
    console.log(_.map(data, _.iteratee('Id')));

    // console.log(data);
    _.map(data, function(obj) {
      _.map(obj, function(val, key) {

        console.log(key, val);
      });
    });

    //create bootstraptable
    return $('<table class="table table-striped"><thead><tr><th data-field="id" class="col-md-2">Item ID</th><th data-field="name" class="col-md-6"><i class="glyphicon glyphicon-star"></i>Item Name</th><th data-field="price" class="col-md-4"><i class="glyphicon glyphicon-heart"></i>Item Price</th></tr></thead></table>');
  }

}

/************************************TOOLKIT*************************************/
var toolkit = {
    $               :   jQuery,
    cache           :   {},

    gridview        :   function(data, options){
        if(typeof data === 'undefined') {
            console.error('toolkit.gridview requires data to work (first param left undefined)');
            return;
        }
        // if(!toolkit.isArray(data)) {
        if(!_.isArray(data)) {
        	console.error('toolkit.gridview expects first parameter to be an array, given: '+toolkit.getPrototype(data));
        	return;
        }

        // if(!toolkit.isObject(data[0])) {
        if(!_.isObject(data[0])) {
            console.error('toolkit.gridview expects first parameter to be array of objects, given array of '+toolkit.getPrototype(data[0]));
            return;
        }

        var gv = {
            data        :   data,
            cols        :   [],
            currPage    :   1,
            options     :   null,
            defaults     :   {
                isPaginated     :   false,
                pageSize        :   20,
                sortCol         :   "",
                sortDirection   :   "ASC",
                id              :   "",
                legend          :   "",
                additionalCols  :   {},
                "class"         :   "",
                style           :   "",
                blackList       :   []
            },

            _resetOptions    :   function() {
                this.options = this.defaults;
            },

            _loadOptions     :   function(options){
                // if(toolkit.isNull(this.options)) this.resetOptions();
                if(_.isNull(this.options)) this._resetOptions();
                // if(!toolkit.isObject(options)) {
                if(!_.isObject(options)) {
                    console.error("loadOptions expects param "+options
                        +" to be of type Object, given "+toolkit.getPrototype(options));
                }
                for(var i in this.options) {
                    if(options.hasOwnProperty(i)) {
                        if(i === 'pageSize' && options[i] < 1) {
                            console.error('toolkit.gridview: page size cannot be less than 1')
                        } else this.options[i] = options[i];
                    }
                }
            },

           	_isPrintable     :   function(obj){
				        return this._getPrototype(obj) === '[object String]' || this._getPrototype(obj) === '[object Number]';
				    },

				    _getPrototype    :       function(obj){
				        return Object.prototype.toString.call(obj);
				    },

				    _contains        :       function(needle, haystack, isKey, exact, caseSensitive){
				        if(typeof isKey === 'undefined') isKey = false;
				        if(typeof exact === 'undefined') exact = false;
				        if(typeof caseSensitive === 'undefined') caseSensitive = false;

				        var r = false;
				        for(var prop in haystack) {
				            if(!isKey && !this._isPrintable(haystack[prop])) continue;
				            if(!this._isPrintable(needle)) continue;
				            
				            if(!caseSensitive) {
				                var search = exact ? "^" + needle + "$" : needle,
				                    regex = new RegExp(search, "i");

				                r = isKey && prop.search(regex) !== -1 || !isKey && haystack[prop].search(regex) !== -1;
				            } else {
				                r = exact ?
				                    (isKey? needle === prop : needle === haystack[prop]) :
				                    (isKey? prop.indexOf(needle) !== -1 : haystack[prop].indexOf(needle) !== -1);
				            }

				            if(r) {
				                return haystack[prop];
				            }
				        }
				        return null;
				    },

            sortByColumn    :   function(propName) {
                if(typeof propName === 'undefined') propName = this.options.sortCol;
                if(typeof this.data[0][propName] === 'undefined') return;

                var self = this;

                function _swap(arr, a, b) {
						        var tmp=arr[a];
						        arr[a]=arr[b];
						        arr[b]=tmp;
						    }

                function partition(array, propName, begin, end, pivot) {
                    var store = begin,
                        pivotVal = array[pivot][propName];

                    _swap(array, pivot, end-1);
                    for(var i=begin; i<end-1; i++) {
                        if(self.options.sortDirection.toLowerCase() === 'asc') {
                            if(array[i][propName] <= pivotVal) {
                                _swap(array, ++store-1, i);
                            }
                        } else {
                            if(array[i][propName] >= pivotVal) {
                                _swap(array, ++store-1, i);
                            }
                        }
                    }
                    _swap(array, end-1, store);
                    return store;
                }
                function qsort(array, propName, begin, end) {
                    if(end-1 > begin) {
                        var pivot=begin+Math.floor(Math.random()*(end-begin));
                        pivot=partition(array, propName, begin, end, pivot);

                        qsort(array, propName, begin, pivot);
                        qsort(array, propName, pivot+1, end);
                    }
                }
                qsort(this.data, propName, 0, this.data.length);
            },

            init  :   function(params){
                // if(toolkit.isNull(this.options)) this.resetOptions();
                if(_.isNull(this.options)) this._resetOptions();
                if(typeof params !== 'undefined') this.loadOptions(params);

                //assign DOM id
                if(!this.options.id) this.options.id = 'gridview-' + Math.ceil(Math.random()*10000);

                //Get list of table cols
                for(var i in data[0]) {
                    if(data[0].hasOwnProperty(i)) this.cols.push(i);
                }

                //Sort data if necessary
                if(this.options.sortCol) this.sortByColumn();

                toolkit.cache[this.options.id] = {};
            },

            addColumn       :   function(position, content, label, style){
                this.options.additionalCols[position] = {content : content, label : label};
                if(typeof style !== 'undefined') {
                    this.options.additionalCols[position]["style"] = style;
                }
            },

            addColumns      :   function(colList) {
                for(var i in colList) {
                    this.options.additionalCols[i] = colList[i];
                }
            },

            // createGridview  :   function(renderTo, empty){
            //     var html = this.getHTML(),
            //         domElement = null;

            //     if(typeof renderTo !== 'undefined') {
            //         if(toolkit.isObject(renderTo)) domElement = renderTo;
            //         else if (toolkit.validateDataType(renderTo, 'string')) domElement = toolkit.$(renderTo);
            //         else {
            //             console.error('gridview.createGridview first param must be either a selector string'+
            //                 ' or a jQuery DOM object, given: '+toolkit.getPrototype(renderTo));
            //             return;
            //         }

            //         if(typeof empty !== 'undefined' && empty) domElement.empty();

            //         domElement.append(html);
            //     }
            // },

            getHTML         :   function(){
                // var cSize = toolkit.sizeOf(this.options.additionalCols),
                var cSize = _.size(this.options.additionalCols),
                    colCount = 0,
                    tmp = [],
                    additionalCols = this.options.additionalCols,
                    html = '<table class="gridview'
                        + (this.options.class.length ? ' '+this.options.class : '') + '"'
                        + (this.options.id.length ? ' id="'+this.options.id+'"' : '') + '>'
                        + (this.options.legend.length ? '<legend>'+this.options.id+'</legend>' : '')
                        + '<tr class="thead">';

                //Column headers
                for(var i in this.cols) {
                    if(additionalCols.hasOwnProperty(++colCount -1)) {
                        //Insert user-defined cols
                        do {
                            // if(!toolkit.isPrintable(additionalCols[colCount-1]['label'])) continue;
                            if(this._isPrintable(additionalCols[colCount-1]['label'])) continue;
                            
                            var style = additionalCols[colCount-1].hasOwnProperty('style') ?
                                ' style="'+additionalCols[colCount-1]['style']+'"' : '';

                            html += '<th' + style + '>'+additionalCols[colCount-1]['label']+'</th>';

                        } while(additionalCols.hasOwnProperty(++colCount -1));
                    }
console.log(this.cols[i], this.options.blackList);
                    if(this._contains(this.cols[i], this.options.blackList) || !this._isPrintable(this.cols[i])) continue;

                    html += '<th onclick="toolkit.cache[\''+this.options.id+'\'].doSort(toolkit.$(this))">'
                        + this.cols[i] + '</th>';
                }

                //more column headers (in case there are user-defined cols that need to be tacked on end)
                if(colCount <= cSize + _.size(this.data[0])) {
                    colCount = html.match(/<th/g).length;
                    for(var i in additionalCols) {
                        if(parseInt(i) <= colCount || !additionalCols[i].hasOwnProperty('label')) continue;
                        if(!toolkit.isPrintable(additionalCols[i]['label'])) continue;

                        var style = additionalCols[i].hasOwnProperty('style') ?
                            ' style="'+additionalCols[i]['style']+'"' : '';

                        html += '<th' + style + '>' + additionalCols[i]['label'] + '</th>';
                    }
                }
                
                html += '</tr>' + this.getTableBody() + '</table>';

                //Pagination
                if(this.options.isPaginated) html += this.getNav();

                return html;
            },

            getTableBody    :   function(){
                if(this.data.length === 0) return;

                var cSize = _.size(this.options.additionalCols),
                    additionalCols = this.options.additionalCols,
                    start = 0,
                    end = this.data.length - 1,
                    html = '',
                    colCount = 0,
                    tmp = [];

                if(this.options.isPaginated) {
                    start = (this.currPage -1) * this.options.pageSize;
                    end = Math.min(this.data.length, start+this.options.pageSize) -1;
                }

                for(var rows=start; rows<=end; rows++) {
                    colCount = 0;
                    var row_id = this._contains("id", this.data[rows], true, true);
                    
                    html += '<tr' + (row_id ? ' data-id="' + row_id + '"' : "") + '>';

                    //execute replace on templated content (user-defined cols)
                    for(var i in additionalCols) {
                        if(!additionalCols[i].hasOwnProperty('content')) continue;

                        tmp[i] = additionalCols[i]['content'].split('%');
                        if(_.size(tmp[i]) > 1) {
                            for(var j =1; j<_.size(tmp[i]); j+=2) {
                                if(this.data[rows].hasOwnProperty(tmp[i][j])) {
                                    tmp[i][j] = this.data[rows][ tmp[i][j] ];
                                } else {
                                    tmp[i][j] = '';
                                }
                            }
                        }
                        tmp[i] = tmp[i].join('');
                    }

                    //build table rows
                    for(var cols in this.data[rows]) {
                        if(additionalCols.hasOwnProperty(++colCount -1)) {
                            do {
                                html += '<td>' + tmp[colCount-1] + '</td>';
                            } while(additionalCols.hasOwnProperty(++colCount -1));
                        }
                        
                        if(this._contains(cols, this.options.blackList)) continue;

                            html += '<td>'+this.data[rows][cols]+'</td>';
                    }

                    if(colCount <= cSize+_.size(this.data[0])) {
                        for(var i in additionalCols) {
                            if(i <= cSize || additionalCols[i].hasOwnProperty('content')) continue;

                            html += '<td>'+tmp[i]+'</td>';
                        }
                    }
                    html += '</tr>';
                }
                return html;
            },
            
            __pageNumberDisplay : function(lastPage){
                var nav = '<ul id="'+this.options.id+'-nav" class="gridview-nav">';
                //list out page numbers according to number of rows and pagination size
                for(var i=1; i<=lastPage; i++) {
                    nav += '<li ' + (i === this.currPage ? ' class="selected"' : '')
                        + ' onclick="toolkit.cache[\''+this.options.id+'\'].goTo(toolkit.$(this), '+i+')">'
                        + i + '</li>';
                }
              return nav+'</ul>';  
            },

            getNav          :   function(){
                var lastPage = Math.ceil(this.data.length/this.options.pageSize),
                    nav = '<span id="'+this.options.id+'-previous" class="gridview-prev'
                        + (this.currPage === 1 ? ' disabled' : '') + '"'
                        + ' onclick="toolkit.cache[\''+this.options.id+'\'].previous(toolkit.$(this))"><</span> '
                        + '';

                nav += this.__pageNumberDisplay(lastPage);

                return nav + ' '
                    + '<span id="'+this.options.id+'-next" class="gridview-next'
                    + (this.currPage === lastPage ? ' disabled' : '') + '"'
                    + ' onclick="toolkit.cache[\''+this.options.id+'\'].next(toolkit.$(this))">></span> ';
            },

            updatePage      :   function(){
                var tbody = this.getTableBody(),
                    next = toolkit.$('#'+this.options.id+'-next'),
                    prev = toolkit.$('#'+this.options.id+'-previous');

                toolkit.$('#'+this.options.id+' tr:has(td)').remove();
                toolkit.$('#'+this.options.id).append(tbody);

                if(this.currPage === Math.ceil(this.data.length/this.options.pageSize)) {
                    next.addClass('disabled');
                } else next.removeClass('disabled');

                if(this.currPage === 1) {
                    prev.addClass('disabled');
                } else prev.removeClass('disabled');
            },

            next            :   function(caller){
                //Don't progress if last page is already displayed
                if(caller.hasClass('disabled') || this.currPage === caller.siblings('ul').children().length) return;

                //Advance to next page
                this.currPage++;
                this.updatePage();

                //update current page indicator
                $('#'+this.options.id+'-nav li.selected').removeClass('selected').next().addClass('selected');
            },

            previous        :   function(caller){
                if(caller.hasClass('disabled') || this.currPage === 1) return;

                //Get previous page
                this.currPage--;
                this.updatePage();

                //update current page indicator
                $('#'+this.options.id+'-nav li.selected').removeClass('selected').prev().addClass('selected');
            },

            goTo            :   function(caller, pageNum){
                //Make sure page is within range (safe-guard against front-end trolls)
                if(pageNum < 1 || pageNum > Math.ceil(this.data.length/this.options.pageSize)) return;

                //Update table data
                this.currPage = pageNum;
                this.updatePage();

                //Update nav page indicator
                $('#'+this.options.id+'-nav li.selected').removeClass('selected');
                $('#'+this.options.id+'-nav li:nth-child('+pageNum+')').removeClass('selected');
            },

            doSort          :   function(caller){
                //Update CSS for column (dirctionality indicator)
                var table = toolkit.$('#'+this.options.id);
                if(caller.hasClass('asc')) {
                    caller.removeClass('asc').addClass('desc');
                    this.options.sortDirection = 'DESC';
                } else {
                    caller.removeClass('desc').addClass('asc');
                    this.options.sortDirection = 'ASC';
                }

                toolkit.$('.asc').not(caller).removeClass('asc');
                toolkit.$('.desc').not(caller).removeClass('desc');

                //Update table data
                this.sortByColumn(caller.text());
                table.find('tr:has(td)').remove();
                table.append(this.getTableBody());
            }
        };

        if(typeof options !== 'undefined') gv._loadOptions(options);
        gv.init();
        toolkit.cache[gv.options.id] = gv;

        return gv;
    }
};
// if(toolkit.querystring('noConflict')) toolkit.$ = jQuery.noConflict();
