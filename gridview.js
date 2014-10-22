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
        console.error('Gridview: Underscore JS  (http://underscorejs.org/) and jQuery are required.');
        return;
    }

    //Required param check
    if (typeof data === 'undefined' || !_.isArray(data) || (data.hasOwnProperty[0] && !_.isObject(data[0]))) {
        console.error('Gridview: Expected first param to be array of objects.');
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
         * @returns void
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
                blackList: []
            };
        },
        /**
         * Copies user-defined options over to this.options
         * @param {Object} options List of options
         * @returns void
         * @since 1.1
         */
        _loadOptions: function (options) {
            if (_.isNull(this.options)) this._resetOptions();
            if (!_.isObject(options)) {
                if(typeof options !== 'undefined') 
                    console.error('Gridview._loadOptions: Expected object, given ' + typeof options);
                return;
            }

            for (var i in this.options) {
                if (!options.hasOwnProperty(i)) continue;
                if (i === 'pageSize' && options[i] < 1) {
                    console.error('GridView._loadOptions: pageSize must be greater than 1.');
                    continue;
                }
                    
                this.options[i] = options[i];
            }

        },

        /**
         * Initializes the gridview object
         * @param {Object} options
         * @returns void
         * @since 1.1
         */
        _init: function (options) {
            this._loadOptions(options);
            this.cols = _.keys(this.data[0]);

            if (this.options.sortCol)
                this.sortByColumn();
        },
        
        refresh: function () {
        }, //@TODO need to give option to update options after create
        
        sortByColumn: function () {
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
            return this.table;
        },
        
        /**
         * Builds the table header for the jQuery table
         * @returns void
         * @since 1.1
         */
        _tableHeader: function () {
            //make sure table object has been created before this is called
            if (typeof this.table !== "object") {
                console.error('GridView._tableHeader: jQuery table object must ' +
                        'be created prior to calling this funciton.')
            }

            var acKeys = _.sortBy(_.keys(this.options.additionalCols), function(k){ return parseInt(k); });
            var th, thead = $('<tr></tr>').appendTo(this.table.find('thead')),
                    i = -1,
                    dataColIndex = -1,
                    colLength = this.cols.length + acKeys.length - this.options.blackList.length,
                    self = this;

            while (++i <= colLength) {
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
                    console.log(label, _.find(this.options.blackList, function (v) { return v === label; }));
                    if (!_.find(this.options.blackList, function (v) { return v === label; })) {
                        th = $('<th' + 
                                (this.options.colStyle ? ' style="' + this.options.colStyle +'"' : '') +
                                '>' + this.cols[dataColIndex] + '</th>');
                        th.on('click', self.doSort);
                        console.log(self.doSort);
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
         * @todo FILTER MULTIPLE BLACKLIST COLUMNS
         */
        _tableBody: function () {
            var table = this.table,
                count = 1,
                indexArr = [],
                blIndex;

            for (var i = 0; i < _.keys(this.data[0]).length; i++) {
                if($.inArray(_.keys(this.data[0])[i], options.blackList) > -1)
                blIndex = $.inArray(_.keys(this.data[0])[i], options.blackList);
            }

            for (var i = 0; i < options.blackList.length; i++) {
                indexArr.push($.inArray(options.blackList[i], _.keys(this.data[0])));
            }
            $('#test').text(indexArr);
            $.each(this.data, function(key, obj) {
                table.append($('<tr id="row' + count + '">'));
                for (var i = 0; i < _.values(obj).length; i++) {

                    // WRONG INDEX
                    // if($.inArray(i, indexArr))
                    if(i == blIndex)
                        table.find('tr#row' + count).append($('<td>').text(_.values(obj)[i]).hide());
                    else
                        table.find('tr#row' + count).append($('<td>').text(_.values(obj)[i]));
                }
                count++;
            });
        },

        _nav: function () {
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
         * @returns void
         * @since 1.1
         */
        doSort: function () {
            console.log($(this));
            var table = $(this).closest('table');
            console.log(table.data('gv'));
//            if($(this).hasClass('asc')) {
//                $(this).removeClass('asc').addClass('desc');
//                table.data('gv')
//            }
//            console.log($(this));
        }
    };

    gv._init(options);
    return gv;
};