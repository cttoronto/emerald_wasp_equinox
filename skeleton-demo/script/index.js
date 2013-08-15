$(document).ready(function(){
	$('button').click(function(event){
		console.log($(this).attr('data-key'));
	})
});