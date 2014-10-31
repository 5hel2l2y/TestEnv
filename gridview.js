/*!
 * ToolkitJS - Gridview
 * -----------------------------------------------------------------------------
 * \brief A widget for a client-side gridview widget
 * 
 * \version 1.1
 * \date 2014-10-22
 * 
 * \author Stephanie Krause (shmkrause)
 * \copyright The MIT License (MIT) Copyright (c) 2014 SAIT ARIS RADLab
 */

var Gridview = function(data, options){
    //Dependency Check
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        this.error('Gridview: Underscore JS  (http://underscorejs.org/) and jQuery are required.');
        return;
    }

    //Required param check
    if (typeof data === 'undefined' || !_.isArray(data) || (data.hasOwnProperty[0] && !_.isObject(data[0]))) {
        this.error('Gridview: Expected first param to be array of objects.');
        return;
    }

    //Allow options to be optional
    options = typeof options === 'undefined' ? {} : options;

    var gv = {
        data: data,
        table: null,
        currPage: 1,
        options: null,
        cols: [],
        /**
         * Sets this.options to hard-coded defaults
         * @returns {undefined}
         */
        _resetOptions: function () {
            this.options = {
                isPaginated: false,
                pageSize: 20,
                sortCol: '',
                sortDirections: 'ASC',
                legend: '',
                klass: '',
                style: '',
                colStyle : '',
                additionalCols: {},
                blackList: [],
                errorHandler: null
            };
        },
        /** 
         * Copies user-defined options over to this.options
         * @param {Object} options List of options
         * @returns {undefined}
         * @since 1.1
         */
        _loadOptions: function (options) {
            if (_.isNull(this.options)) this._resetOptions();
            if (!_.isObject(options)) {
                if(typeof options !== 'undefined') 
                    this.error('Gridview._loadOptions: Expected object, given ' + typeof options);
                return;
            }

            for (var i in this.options) {
                if (!options.hasOwnProperty(i)) continue;
                if (i === 'pageSize' && options[i] < 1) {
                    this.error('GridView._loadOptions: pageSize must be greater than 1.');
                    continue;
                }
                    
                this.options[i] = options[i];
            }

        },

        /**
         * Initializes the gridview object
         * @param {Object} options
         * @returns {undefined}
         * @since 1.1
         */
        _init: function (options) {
            this._loadOptions(options);
            this.cols = _.keys(this.data[0]);

            if (this.options.sortCol) this.sortByColumn();
            
            this.id = Math.ceil(Math.random()*10000);
        },
        
        refresh: function () {
        }, //@TODO need to give option to update options after create
        
        /**
         * Error handler for Gridview, uses either user-specified error handler or console.err
         * @param {String} msg
         * @returns {undefined}
         */
        error: function(msg){
          if(!_.isNull(this.options.errorHandler)) {
              this.options.errorHandler.call(window, msg);
              return;
          }
          console.error(msg);  
        },
        
        /**
         * Sorts gridview data by column (given label)
         * @param {String} propName The column (label) to sort by
         * @return {undefined}
         * @since 1.1
         */
        sortByColumn: function (propName) {
            if(typeof propName === 'undefined') propName = this.options.sortCol;
            if(!this.data[0].hasOwnProperty(propName)) {
                this.error('Gridview.sortByColumn: sort selection not available.');
                return;
            }
            
            var self = this;
            
            /**
             * Swaps the context of 2 buckets (should *technically* work for objects)
             * @param {Array} arr The array
             * @param {String} a Index 1
             * @param {String} b Index 2
             */
            function swap(arr, a, b) {
                var tmp = arr[a];
                arr[a] = arr[b];
                arr[b] = tmp;
            }
            
            /**
             * Swaps bucket contents for a given pivot
             * @param {Array} array
             * @param {propName} propName The property on which to sort
             * @param {Number} begin
             * @param {Number} end
             * @param {Number} pivot
             */ 
            function partition(array, propName, begin, end, pivot) {
                var store = begin,
                pivotVal = array[pivot][propName];
                swap(array, pivot, end-1);
                for(var i=begin; i<end-1; i++) {
                    if(self.options.sortDirection.toLowerCase() === 'asc') {
                        if(array[i][propName] <= pivotVal) {
                            swap(array, ++store-1, i);
                        }
                    } else {
                        if(array[i][propName] >= pivotVal) {
                            swap(array, ++store-1, i);
                        }
                    }
                }
                swap(array, end-1, store);
                return store;
            }
                
            /**
             * Quick sort implementation
             * @param {Array} array The array/object to sort
             * @param {String} propName The property on which to search
             * @param {number} begin
             * @param {number} end
             */
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
        
        /**
         * Creates a jQuery table object
         * @returns {jQuery}
         * @since 1.1
         */
        create: function () {
            //Create table with configured attributes
            var s = this.options.style.length ? '' : '';
            this.table = jQuery('<table'+s+'><thead></thead><tbody></tbody></table>');

            if(this.options.klass.length)  this.table.attr('class', this.options.klass);
            if(this.options.legend.length) {
                $('<legend></legend>').text(this.options.legend).prependTo(this.table)
            }
            
            //create table body and header
            this._tableHeader();
            this._tableBody();
            /*if (this.options.isPaginated)*/ this._nav();

            //attach data to DOM element and return (with items as required)
            this.table.data('gv', this);
            this.table.data('id', this.id);
            return this.table.siblings().addBack();
        },
        
        /**
         * Builds the table header for the jQuery table
         * @returns {undefined}
         * @since 1.1
         */
        _tableHeader: function () {
            //make sure table object has been created before this is called
            if (typeof this.table !== "object") {
                this.error('GridView._tableHeader: jQuery table object must ' +
                        'be created prior to calling this funciton.')
            }

            var acKeys = _.sortBy(_.keys(this.options.additionalCols), function(k){ return parseInt(k); });
            var th, thead = $('<tr></tr>').appendTo(this.table.find('thead')),
                    i = -1,
                    dataColIndex = -1,
                    colLength = this.cols.length + acKeys.length,
                    self = this;

            while (++i < colLength) {
              //data cols
                if (++dataColIndex < this.cols.length) {
                    var label = this.cols[dataColIndex];
                    if (!_.find(this.options.blackList, function (v) { return v === label; })) {
                        var s = this.options.colStyle ? ' style="' + this.options.colStyle +'"' : '';
                        $('<th'+s+'>'+this.cols[dataColIndex]+'</th>').on('click', self.doSort).css('border', '2px solid green').appendTo(thead);
                    }
                }

                if(acKeys.length && (parseInt(acKeys[0]) === i || dataColIndex >= this.cols.length)) {
                    //Insert additional cols
                    do {
                        var k = acKeys.shift();
                        if (_.isFunction(this.options.additionalCols[k].content) 
                                || _.isArray(this.options.additionalCols[k].content) 
                                || _.isObject(this.options.additionalCols[k]).content) continue;

                        th = '<th';
                        if (this.options.additionalCols[k].hasOwnProperty('style')) {
                            th += ' style="' + this.options.additionalCols[k].style + '"';
                        }
                        thead.append(th + '>' + this.options.additionalCols[k].label + '</th>');
                        i++;
                    } while (acKeys.length && (parseInt(acKeys[0]) === i || dataColIndex >= this.cols.length));
                }
            }
        },
        
        /**
         * Populate table data, filters blackList columns, add user added additional
         * columns, and pagination.
         * @return undefined
         * @since 1.1
         *
         * @author Sherry Yang
         */
        _tableBody: function () {
          //make sure table object has been created before this is called
          if (!_.isObject(this.table))
              this.error('GridView._tableBody: jQuery table object must be created prior to calling this funciton.');

          var dataKeys = _.keys(this.data[0]),
              dataIndex = 0,
              dataRows = this.data.length,
              dataCols = _.size(this.data[0]),
              totalCols = dataCols + _.size(this.options.additionalCols),
              acKeys = null,
              numPages = Math.ceil(dataRows / this.options.pageSize),
              start = 0,
              end = dataRows;
          
          if(this.options.isPaginated) {
            //indentify start and end on pagination
            start = (this.currPage - 1) * this.options.pageSize;
            end = _.min([this.currPage * this.options.pageSize, dataRows]);
          }

          //first loop
          for (var rowIndex = start; rowIndex < end; rowIndex++) {
            //renew key list
            acKeys = _.sortBy(_.keys(this.options.additionalCols), function(k) { return parseInt(k); });
            dataIndex = 0;
            //create row obj
            var tr = $('<tr id="row' + rowIndex + '">');

            for (var colIndex = 0; colIndex < totalCols; colIndex++) {
                if (dataIndex < dataCols) {
                  //blacklist logic
                  if ($.inArray(dataKeys[dataIndex], this.options.blackList) === -1) {
                    //add td
                    tr.append($('<td>').text(this.data[rowIndex][dataKeys[dataIndex]]).css('border', '2px solid green'));
                  }
                  dataIndex++;
                }

              //additional cols logic
                if (acKeys.length && (acKeys[0] == colIndex || dataIndex >= dataCols)) {
                  do {
                    var k = acKeys.shift();
                    //create td
                    tr.append($('<td>').text(this.options.additionalCols[k].content));
                    colIndex++;
                  } while (acKeys.length && (acKeys[0] == colIndex || dataIndex >= dataCols));
                }
            }
            //add new row to table
            tr.appendTo(this.table);
          }
        },

        /**
         * Builds navigation for pagination
         * @returns {undefined}
         */
        _nav: function () {
            var lastPage = Math.ceil(this.data.length/this.options.pageSize),
                n = $('<ul id="nav-'+this.id+'" class="gridview-nav"></ul>').insertAfter(this.table);
                    
            for(var i=1; i <= lastPage; i++) {
                $('<li'+(i === this.currPage ? ' class="selected"' : '')+'>'+
                        i+'</li>').on('click', this.goTo).appendTo(n);
            }
            
            //Create next/previous nav
            $('<span id="previous-'+this.id+'" '+
                'class="gridview-prev'+(this.currPage === 1? ' disabled' : '')+
                '"><</span>').on('click', this.previous).insertBefore(n);
        
            $('<span id="next-'+this.id+'" '+
                'class="gridview-next'+(this.currPage === lastPage? ' disabled' : '')+
                '">></span>').on('click', this.next).insertAfter(n);
        
        // console.log(n.siblings().addBack());
            
        },
        updatePage: function () {
        },
        
        /**
         * OnClick method for Next navigation button, gets next page content and increments page indicator
         * @returns {undefined}
         * @since 1.1
         */
        next: function () {
            var gv = $(this).siblings().find('table').data('gv');
            
            //make sure forward progression is actually allowed
            if($(this).hasClass('disabled') 
                    || gv.currPage === Math.ceil(gv.data.length/gv.options.pageSize)) return;
            
            //update table contents and currPage counter
            gv.currPage++;
            gv.updatePage();
            
            //update navigation indicator
            $('#nav-'+gv.id+' li.selected').removeClass('selected').next().addClass('selected');
        },
        
        /**
         * OnClick method for Previous navigation button, gets previous page content and decrements page indicator
         * @returns {undefined}
         * @since 1.1
         */
        previous: function () {
            var gv = $(this).siblings().find('table').data('gv');
            
            //make sure backward progression is actually allowed
            if($(this).hasClass('disabled') || gv.currPage === 1) return;
            
            //update table contents and currPage counter
            gv.currPage--;
            gv.updatePage();
            
            //update navigation indicator
            $('#nav-'+gv.id+' li.selected').removeClass('selected').prev().addClass('selected');
        },
        
        /**
         * OnClick method for page numbers, gets the page content for given number
         * @param {type} pageNum The page for which data should be fetched
         * @returns {undefined}
         * @since 1.1
         */
        goTo: function (pageNum) {
            var gv = $(this).closest('ul').siblings().find('table').data('gv');
            
            //Make sure pageNum is in range
            if(pageNum < 1 || pageNum > Math.ceil(gv.data.length/gv.options.pageSize)) return;
            
            //update table contents and currPage counter
            gv.currPage = pageNum;
            gv.updatePage();
            
            //update nav pageIndicator
            $(this).addClass('selected').siblings('.selected').removeClass('selected');
        },
        
        /**
         * OnClick event for th objects
         * @returns {undefined}
         * @since 1.1
         */
        doSort: function () {
            var table = $(this).closest('table');
            if($(this).hasClass('asc')) {
                $(this).removeClass('asc').addClass('desc');
                table.data('gv').options.sortDirection = 'DESC';
            } else {
                $(this).removeClass('desc').addClass('asc');
                table.data('gv').options.sortDirection = 'ASC';
            }
            
            $('.asc').not($(this)).removeClass('asc');
            $('.desc').not($(this)).removeClass('desc');
            
            //Update table contents
            table.data('gv').sortByColumn($(this).text());
            table.find('tbody').empty().append(table.data('gv')._tableBody());
        }
    };

    gv._init(options);
    return gv;
};