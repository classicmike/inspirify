(function(){
    var app = {};

    //possibly required echo nest
    //required spotify

    app.Song = function(){

    };

    app.Song.prototype.setup = function(title, duration, songUrl){
        this.title = title;
        this.song = duration;
        this.songUrl = songUrl;
        app.song.id++;
        this.id = app.song.id;
    };

    app.Song.id = 0;




    app.Artist = function(){

    };

    app.Artist.prototype.setup = function(name, biography, songs, genres){
        this.name = name;
        this.biography = biography;
        this.songs = songs;
        this.genres = genres;
    };

    app.Artist.prototype.addSongs = function(songsJSON){
        for(var i = 0; i < songsJSON.length; i++){
            var song = new app.Song(songsJSON[i]);
        }
    };

    /***--------- ARTIST LIST Collection ------------ ***/
    //@todo: Refactor this to use a static function creating a constructor.
    app.ArtistsList = function(){
        this.setup();
        this.setEvents();
    };

    app.ArtistsList.prototype.setup = function(){
        this.resetResults();
    };

    app.ArtistsList.prototype.resetResults = function(){
        this.artists = [];
    };

    app.ArtistsList.prototype.setEvents = function(){

    };


    app.ArtistsList.performSearch = function(query){
        return $.get(app.ArtistsList.SEARCH_URL, {q: query, type: app.ArtistsList.ARTIST_PARAMETER_NAME, limit: 1});
    };


    app.ArtistsList.processArtistResult = function(results){

        if(!results.artists.items.length){
            console.log('Provide a way to return no results');
        }
        //the top one is assumed to be the most related result
        var mostRelevantArtist = results.artists.items[0];

        var url = app.ArtistsList.RELATED_SEARCH_URL.replace('{id}', mostRelevantArtist.id.toString());

        $.get(url).done(this.processRelatedArtistResults.bind(this));

    };

    app.ArtistsList.prototype.processRelatedArtistResults = function(relatedResults){
        console.log('Got the related results');
        console.log(relatedResults);
    };

    app.ArtistsList.SEARCH_URL = 'https://api.spotify.com/v1/search';
    app.ArtistsList.RELATED_SEARCH_URL = 'https://api.spotify.com/v1/artists/{id}/related-artists';
    app.ArtistsList.ARTIST_PARAMETER_NAME = 'artist';
    app.ArtistsList.RELATED_ARTIST_LIMIT = 6;

    /***--------- ARTIST LIST Collection ------------ ***/




    /***--------- SEARCH BOX Controller ------------ ***/
    app.SearchBoxController = function(eventEmmitter){

        if(!eventEmmitter){
            return;
        }
        this.setup(eventEmitter);
        this.setEvents();
    };


    app.SearchBoxController.prototype.setup = function(eventEmmitter){
        this.eventEmitters = eventEmitter;
        this.view = {};
    };

    app.SearchBoxController.prototype.setEvents = function(){
        //add required events
    };

    app.SearchBoxController.prototype.processSearchSubmit = function(searchTerms){
        console.log(searchTerms);
        //fire off an event handler that will allow you to search
        this.eventEmitters.emitEvent('search-artist', [searchTerms]);
    };

    /***--------- SEARCH RESULTS Controller ------------ ***/

    app.SearchResultsController = function(eventEmmitter){

        if(!eventEmmitter){
            return;
        }
        this.setup(eventEmitter);
        this.setEvents();
    };


    app.SearchResultsController.prototype.setup = function(eventEmmitter){
        this.eventEmitters = eventEmitter;
        this.view = {};
        this.artistsList = new app.ArtistsList();
    };

    app.SearchResultsController.prototype.setEvents = function(){
        this.eventEmitters.addListener('search-artist', this.searchArtist.bind(this));
    };

    app.SearchResultsController.prototype.searchArtist = function(searchTerms){
        console.log(searchTerms);

        this.artistsList.performSearch(searchTerms);

    };


    /***--------- SEARCH RESULTS Controller ------------ ***/


    app.ArtistController = function(){

    };

    /***--------- SEARCH BOX VIEW ------------ ***/

    app.SearchBoxView = function(controller){
        if(!controller){
            return;
        }
        this.setup(controller);
        this.setEvents();
    };

    app.SearchBoxView.prototype.setup = function(controller){
        this.searchBoxElement = $(app.SearchBoxView.ELEMENT_ID);
        this.controller = controller;

        console.log(this.controller);

        this.controller.view = this;
    };

    app.SearchBoxView.prototype.setEvents = function(){
        this.searchBoxElement.on('submit', this.processSearchSubmit.bind(this));
    };

    app.SearchBoxView.prototype.processSearchSubmit = function(event){
        event.preventDefault();

        var inputElement = $(event.target).find('input[name="' + app.SearchBoxView.INPUT_NAME + '"]');

        //controller
        var searchTerms = inputElement.val();

        //search terms need to be entered to proceed with the submit
        if(searchTerms.length === 0 || typeof searchTerms.length === 'undefined' ){
            alert('No Search Terms have been entered aborting...');
            return false;
        }



        this.controller.processSearchSubmit(searchTerms);

    };


    app.SearchBoxView.ELEMENT_ID = "#artist-search";
    app.SearchBoxView.INPUT_NAME = 'artist-search';

    /***--------- SEARCH BOX VIEW ------------ ***/

    /***--------- SEARCH RESULTS VIEW ------------ ***/
    app.SearchResultsView = function(controller){
        if(!controller){
            return;
        }

        this.setup(controller);
        this.setEvents();
    };


    app.SearchResultsView.prototype.setup = function(controller){
        this.controller = controller;

        this.controller.view = this;
    };

    app.SearchResultsView.prototype.setEvents = function(){

    };

    /***--------- SEARCH RESULTS VIEW ------------ ***/


    /***--------- ARTIST MODAL VIEW ------------ ***/
    app.ArtistModalView = function(){

    };

    /***--------- ARTIST MODAL VIEW ------------ ***/



    $(document).ready(function(){


        var eventEmitters = new EventEmitter();

        //instantiate all controllers
        var searchController = new app.SearchBoxController(eventEmitters);
        var searchBoxView = new app.SearchBoxView(searchController);

        var searchResultsController = new app.SearchResultsController(eventEmitters);
        var searchBoxView = new app.SearchResultsView(searchResultsController);


    });
})(jQuery);