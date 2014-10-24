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
            this.table = jQuery('<table><thead></thead><tbody></tbody></table>');
            this._tableHeader();
            this._tableBody();
            /*if (this.options.isPaginated)*/ this._nav();

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
                    if($.inArray(this.cols[dataColIndex], this.options.blackList) === -1){
                        var s = this.options.colStyle ? ' style="' + this.options.colStyle +'"' : '';
                        $('<th'+s+'>'+this.cols[dataColIndex]+'</th>').on('click', self.doSort).appendTo(thead);
                    }
                }
            }
        },
        
        /**
         * Populate table data, filters blackList columns.
         * @return undefined
         * @since 1.1
         *
         * @author Sherry Yang
         * @todo additonalCols, and pagination
         */
        _tableBody: function () {
            //make sure table object has been created before this is called
            if (!_.isObject(this.table))
                this.error('GridView._tableBody: jQuery table object must be created prior to calling this funciton.');

            var tr, td,
                rowCount = this.data.length,
                count = 0,
                blkListArray = [],
                acKeys = _.sortBy(_.keys(this.options.additionalCols), function(k){ return parseInt(k); });

            console.log(this.cols);
            
            for (var i = 0; i < this.options.blackList.length; i++) {
                blkListArray.push($.inArray(this.options.blackList[i], _.keys(this.data[0])));
            }

            while (count < rowCount) {
                tr = $('<tr id="row' + count + '">').appendTo(this.table);
                for (var k = 0; k < _.values(this.data[count]).length; k++) {
                    if($.inArray(k, blkListArray) === -1)
                        tr.append($('<td>').text(_.values(this.data[count])[k]));
                }

                for (var i = 0; i < _.values(this.options.additionalCols).length; i++) {
                    if($.inArray(count, acKeys) === -1) {
                        // console.log(this.cols.length);
                        
                        //@TODO this is shifting while for loop
                        var k = acKeys.shift();
                        console.log(k);
                        
                    }
                    console.log(acKeys);

                    // tr.append($('<td>').text(_.values(this.options.additionalCols)[i].content));
                }

                count++;
            }

            for(i = 0; i < rowCount; i++){
               var tbRow = $('<tr>').appendTo(this.table);
               for (j = 0; j < rowCount; j++){
                  tbRow.append($('<td>').text('row ' + i + ', column ' + j));
               }
            }


            // var acKeys = _.sortBy(_.keys(this.options.additionalCols), function(k){ return parseInt(k); }),
            //     additionalColsSize = acKeys.length,
            //     additionalCols = this.options.additionalCols,
            //     start = 0,
            //     end = this.data.length - 1,
            //     colCount = 0,
            //     tempArray = [],
            //     tr = $('<tr>').appendTo(this.table);

            // for (var rows = start; rows <= end; rows++) {
            //     colCount = 0;

            //     for (var index in additionalCols) {
            //         if(!additionalCols[index].hasOwnProperty('content'))
            //             continue;

            //         tempArray[index] = additionalCols[index]['content'];
            //         if(_.size(tempArray[index] > 1)) {
            //             for (var insideIndex = 1; insideIndex < _.size(tempArray[index]); insideIndex += 2) {
            //                 if(this.data[rows].hasOwnProperty(tempArray[index][insideIndex]))
            //                     tempArray[index][insideIndex] = this.data[rows][tempArray[index][insideIndex]];
            //             };
            //         }
            //         console.log(tempArray[index]);
            //     }

            //     for (var cols in this.data[rows]) {
            //         if(additionalCols.hasOwnProperty(++colCount - 1)) {
            //             do {
            //                 console.log(tempArray[colCount - 1]);
            //                 tr.append($('<td>').text(tempArray[colCount - 1]));
            //             } while (additionalCols.hasOwnProperty(++colCount - 1));
            //         }

            //         if(this.options.hasOwnProperty('blackList'))
            //             continue;

            //         console.log(this.data[rows][cols]);
            //     }
            // }
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
        
        console.log(n.siblings().addBack());
            
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