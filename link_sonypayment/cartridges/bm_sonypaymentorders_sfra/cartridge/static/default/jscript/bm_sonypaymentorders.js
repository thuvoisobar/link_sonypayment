function actionSearch(){
	var $unregistration = $('.unregistration-custom'),
		$inputfield = $unregistration.find('.inputfield_en'),
		searchBtn = $unregistration.find('#searchFocus'),
		cur_url = $unregistration.find('#cur_url').val();
		
	console.log(cur_url);
	searchBtn.click(function(e){
		e.preventDefault();
		if($inputfield.val().trim() != ''){
			cur_url += '?orderNo=' + $inputfield.val().trim();
		}
		window.location = cur_url;
	});
	
	$inputfield.keyup(function (e) {
	    if (e.keyCode == 13) {
	    	e.preventDefault();
			if($inputfield.val().trim() != ''){
				cur_url += '?orderNo=' + $inputfield.val().trim();
			}
			window.location = cur_url;
	    }
	});
}