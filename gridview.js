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
        currPage: 1,
        options: null,
        cols: [],
        /**
         * Sets this.options to hard-coded defaults
         * @returns {void}
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
         * @returns {void}
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
         * @returns {void}
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
         * @returns {void}
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
         * @return {void}
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
            this.table = jQuery('<table><thead></thead><tbody></tbody></table>');
            this._tableHeader();
            this._tableBody();
            if (this.options.isPaginated) this._nav();

            this.table.data('gv', this);
            this.table.data('id', this.id);
            return this.table;
        },
        
        /**
         * Builds the table header for the jQuery table
         * @returns {void}
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
                    } while (acKeys.length && (parseInt(acKeys[0]) === ++i || dataColIndex >= this.cols.length));
                }

                //data cols
                if (++dataColIndex < this.cols.length) {
                    var label = this.cols[dataColIndex];
                    if (!_.find(this.options.blackList, function (v) { return v === label; })) {
                        th = $('<th' + 
                                (this.options.colStyle ? ' style="' + this.options.colStyle +'"' : '') +
                                '>' + this.cols[dataColIndex] + '</th>');
                        th.on('click', self.doSort);
                        thead.append(th);
                    }
                }
            }
        },
        
        /**
         * Populate table data, filters blackList columns.
         * @return void
         * @since 1.1
         *
         * @author Sherry Yang
         * @todo FILTER MULTIPLE BLACKLIST COLUMNS
         */
        _tableBody: function () {
            var table = this.table,
                count = 1,
                indexArr = [];

            for (var i = 0; i < options.blackList.length; i++) {
                indexArr.push($.inArray(options.blackList[i], _.keys(this.data[0])));
            };

            for (var j = 0; j < this.data.length; j++) {
              table.append($('<tr id="row' + count + '">'));
                for (var i = 0; i < _.values(this.data[j]).length; i++) {
                    if($.inArray(i, indexArr) > -1)
                        table.find('tr#row' + count).append($('<td>').text(_.values(this.data[j])[i]).hide());
                    else
                        table.find('tr#row' + count).append($('<td>').text(_.values(this.data[j])[i]));
                }
                count++;
            }
        },

        _nav: function () {
            var lastPage = Math.ceil(this.data.length/this.options.pagesize),
                nav = $('<span id="' + this.id + '-previous" class="gridview-prev">' + 
                    '');
        },
        updatePage: function () {
        },
        next: function () {
        },
        previous: function () {
        },
        goTo: function () {
        },
        
        /**
         * OnClick event for th objects
         * @returns {void}
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
            table.find('tr:has(td)').remove().end().append(table.data('gv')._tableBody());
        }
    };

    gv._init(options);
    return gv;
};