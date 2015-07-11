(function(){
    var app = {};

    //possibly required echo nest
    //required spotify

    app.Song = function(){
    };

    app.Artist = function(){
    };

    app.ArtistsList = function(){
    };


    app.SearchBarController = function(){
    };


    app.SearchResultsController = function(){

    };

    app.ArtistController = function(){

    };


    app.MainView = function(){

    };

    app.SearchBoxView = function(){
        this.searchBoxElement = $(app.SearchBox.ElementId);
    };

    app.SearchBoxView.prototype.setEvents = function(){
        this.searchBoxElement.on('submit', this.processSearchSubmit.bind(this));
    };

    app.SearchBoxView.prototype.processSearchSubmit = function(event){
        event.preventDefault();

        var inputElement = $(event.target).find('input[name="' + app.SearchBox.INPUT_NAME + '"]');

        //controller
    };

    app.SearchBoxView.ElementId = "#artist-search";
    app.SearchBoxView.INPUT_NAME = 'artist-search';

    app.SearchResultsView = function(){

    }

    //possibly need to destory the current modal view when you open an new artist.
    app.ArtistModalView = function(){

    };



    $(document).ready(function(){
        //instantiate all controllers
        var searchController = new app.SearchBarController();
        var searchBoxView = new app.SearchBoxView(searchController);


        var searchResultsController = new app.SearchResultsController();
        var searchResultsView = new app.s
    });
})(jQuery);