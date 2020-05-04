'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ["$scope", "$http", "$timeout", "$sce", "$interval", function($scope, $http, $timeout, $sce, $interval) {
     $scope.at_least_one_question_loaded = false;
     $scope.answer_choice = {};
     $scope.alert_message = "";
     $scope.alert_additional_details = [];
     $scope.is_loading = false;

     $scope.staging = false;
     $scope.staging_message = "Setting things up!"

     $scope.show_log = false;
     $scope.question_tests = [];
     $scope.question_tests_temp = []

     $scope.all_question_statuses = []

     $http.get("/remaining_time").then(function(response){
            var remaining_seconds = response.data;
            console.log("Remaining time = " + remaining_seconds);
            if(remaining_seconds<0)remaining_seconds=0;
            var clock = $('.your-clock').FlipClock(remaining_seconds, {
                countdown: true,
                clockFace: 'MinuteCounter'
            });
        }, function(response){
            console.log(response)
        })

    $scope.heart_beat_status = true

    var check_heart_beat = function(){
        console.log("Checking heart beat")
        $http.get("/heart_beat").then(function(response){
            if(response.data == "success"){
                $scope.heart_beat_status = true
            }else{
                $scope.heart_beat_status = false
            }

        },function(response){
            $scope.heart_beat_status = false
        })
    }

    stop = $interval(check_heart_beat, 5000);
    check_heart_beat()

     $scope.formatNumber = function(number){

        return (number).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})

     }

     $scope.shuffle = function(array){
        if(array){
            var count = array.length,
             randomnumber,
             temp;
         while( count ){
          randomnumber = Math.random() * count-- | 0;
          temp = array[count];
          array[count] = array[randomnumber];
          array[randomnumber] = temp
         }
        }

        return array
     }

     $scope.getRangeOfQuestions = function(){
        var array = new Array();
        if($scope.question && $scope.question.hasOwnProperty("total_questions")){
            for(var i = 0; i < $scope.question.total_questions; i++)
            {
                array.push(i);
            }
        }

        return array;
     }

     $scope.toggleLogs = function(){
        if(!$scope.show_log) $scope.get_logs();
        else $scope.show_log = false;
     }

     $scope.get_logs = function(){
        $scope.show_log = true
        $http.get("/logs").then(function(response){
            $scope.logs = response.data;
            M.textareaAutoResize($('#logsTextArea'));
        }, function(response){
            console.log(response)
        })
     }

     $scope.skip = function(){

        reset_messages();
        $scope.load_error = ""

        $http.post("/question", {skip: true}).then(function(response){

            $scope.is_loading = false;
            $scope.question = response.data;
            console.log($scope.question)
            $scope.answer_statuses = $scope.question.answer_statuses;
            $scope.check_for_before();
            $scope.at_least_one_question_loaded = true;
            $scope.question_tests = $scope.question.tests;

         }, function(response){

            console.log("Error=" + JSON.stringify(response.data))
            $scope.alert_message = response.data && response.data.message ||  response.data;

            if(response.data.additional_details){
                $scope.alert_additional_details = response.data.additional_details;
                $scope.question_tests = response.data.additional_details;
            }


            $scope.alert_type = "danger"
            $scope.is_loading = false;
         })

     }

     var reset_messages = function(){
        $scope.alert_message = "";
        $scope.alert_additional_details = [];
        $scope.is_loading = true;
        $scope.question_tests = [];

        $(event.target).removeClass('shake-vertical');
        $(event.target).removeClass('shake-horizontal');
        $(event.target).removeClass('teal accent-1');

        $('.collapsible').collapsible('close');
     }

     $scope.onSubmit = function(event, answer){

        reset_messages();

        $scope.is_info = $scope.question.type == "info";

        if ($scope.is_info){
            $scope.skip()
            return
        }

        $http.post("/question", {answer: answer}).then(function(response){
            $scope.is_loading = false;

            $timeout(function(){
                $scope.celebrate($(event.target))
            }, 10);

            $timeout(function(){
                $scope.question = response.data;
                $scope.answer_statuses = $scope.question.answer_statuses;
                $scope.check_for_before();
                $(event.target).removeClass('shake-vertical');
                $(event.target).removeClass('shake-horizontal');
                $(event.target).removeClass('teal accent-1');
                $scope.question_tests = $scope.question.tests;
                if($scope.question.challenge){
                    updateGraph()
                }
            }, 1000);

         }, function(response){

            console.log("Error=" + JSON.stringify(response.data))
            $scope.alert_message = response.data.message;

            if(response.data.additional_details){
                if (Array.isArray(response.data.additional_details)){
                    $scope.alert_additional_details = response.data.additional_details;
                    $scope.question_tests = response.data.additional_details;
                }else{
                    $scope.alert_additional_details = [response.data.additional_details];
                    $scope.question_tests = [response.data.additional_details];
                }

                if($scope.question.challenge){
                    updateGraph()
                }

            }

            $scope.alert_type = "danger"
            $scope.is_loading = false;

            $timeout(function(){
                $(event.target).addClass('shake-horizontal');
                $(event.target).addClass('red');
            }, 10);

            $timeout(function(){
                $(event.target).removeClass('red');
            }, 1000);

         })

     }


     $scope.celebrate = function(button){

        button.addClass('shake-vertical');
        button.addClass('teal accent-1');

        let x = button.offset().left - 100;
        let y = button.offset().top - 120;
        explode(x, y);

    }

     $scope.load_error = ""

     $scope.next_question = function(){
        $scope.is_loading = true;
        $scope.load_error = ""
         $http.get("/question").then(function(response){
            $scope.question = response.data;
            console.log($scope.question)
            $scope.answer_statuses = $scope.question.answer_statuses;
            $scope.is_loading = false;
            $scope.check_for_before();
            $scope.question_tests = $scope.question.tests;

            if($scope.question && $scope.question.hasOwnProperty("total_questions")){
                for(var i = 0; i < $scope.question.total_questions; i++)
                {
                    $scope.all_question_statuses.push({
                        "number": i,
                        "status": "waiting"
                    });
                }
            }

         }, function(response){
            $scope.is_loading = false;
            console.log(response)
            $scope.load_error = response.statusText
         })
     }

     $scope.check_for_before = function(){

        if($scope.question.options)
        $scope.question.options = $scope.shuffle($scope.question.options)

        if($scope.question.lab)
        $scope.feedback_url = $sce.trustAsResourceUrl("https://docs.google.com/forms/d/e/1FAIpQLScUtCqkM2cyO_kDUWScqNWLcsm0R-5HliJM8IuIFKhC262CiA/viewform?embedded=true&usp=pp_url&entry.1324405225=" + $scope.question.lab);

        if($scope.question.challenge_diagram)
        drawGraph($scope.question.challenge_diagram)

        if($scope.question.before != null){

            $scope.staging = true;
            $scope.staging_message = $scope.question.staging_message || "Setting things up!";

            $http.post("/stage").then(function(response){
                $scope.question = response.data
                $scope.staging = false;
            }, function(response){
                console.log(response.data)
                $scope.staging = false;
            })

        }

     }

     $scope.next_question()

    var markRed = function(cell){

        if (cell.type == "standard.Image" || cell.type == "standard.BorderedImage"){
            cell.type = "standard.BorderedImage"
            cell.attrs.border = {
                "rx": 5,
                "stroke": "red"
              }
            cell.attrs.background = {
                "fill": "rgba(255, 0, 0, 0.3)"
              }
        }else if (cell.type == "standard.Link"){
                cell.attrs = {
                  "line": {
                    "stroke": "red"
                  }
                }
        }

    }

    var markGreen = function(cell){

        if(cell.type == "standard.Image" || cell.type == "standard.BorderedImage"){
            cell.type = "standard.BorderedImage"
            cell.attrs.border = {
                "rx": 5,
                "stroke": "green"
              }
            cell.attrs.background = {
                "fill": "rgba(0, 255, 0, 0.3)"
              }
        }else if (cell.type == "standard.Link"){
                cell.attrs = {
                  "line": {
                    "stroke": "green"
                  }
                }
        }
    }

    var updateGraph = function(){

        var temp_map = {}

        for(var i = 0; i < $scope.question_tests.length; i++){
            var test = $scope.question_tests[i]
            for(var j = 0; j < $scope.question.challenge_diagram.cells.length; j++){
                    var cell = $scope.question.challenge_diagram.cells[j]

                    if(cell.id == test.graph_element){

                        if (!temp_map[cell.id]){
                            temp_map[cell.id] = []
                        }

                        temp_map[cell.id].push(test.test_result)

                        if(temp_map[cell.id].every(val => val)){
                            markGreen(cell)
                        }else{
                            markRed(cell)
                        }
                    }
                }
        }
        graph.fromJSON($scope.question.challenge_diagram)
    }

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('drawing-pad'),
        model: graph,
        width: 700,
        clickThreshold: 1,
        height: 500,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(255, 255, 255, .8)'
        },
        text: 'white'
    });

    var drawGraph = function(graphJSON){
      graph.fromJSON(graphJSON)
    }

    var filterQuestionTests = function(modelID){

        $scope.question_tests_temp = []

        for(var i = 0; i < $scope.question_tests.length; i++){
            var test = $scope.question_tests[i]

            if(modelID == test.graph_element){
                $scope.question_tests_temp.push(test)
                $scope.$apply()
            }
        }
    }

    paper.on('cell:pointerclick', (cellView) => {
      console.log("element clicked")
      $scope.selected_cell = cellView;
      filterQuestionTests(cellView.model.id)
    })

    // drawGraph({"cells":[{"type":"standard.Image","position":{"x":250,"y":20},"size":{"width":75,"height":75},"angle":0,"id":"f8e3ce09-1850-4b63-b9fb-b9e154311952","z":16,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pod.svg"},"label":{"text":"wordpress", "fill": "white"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":600,"y":20},"size":{"width":75,"height":75},"angle":0,"id":"b32b6a34-2f96-44a5-9e31-21a0aaaa90f6","z":16,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pod.svg"},"label":{"text":"mysql"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":250,"y":150},"size":{"width":75,"height":75},"angle":0,"id":"0e383225-b978-45b4-a730-3b42b079beb5","z":20,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pvc.svg"},"label":{"text":"wordpress"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":600,"y":160},"size":{"width":75,"height":75},"angle":0,"id":"3b8dcabe-387b-4a88-a920-7282f15053b8","z":20,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pvc.svg"},"label":{"text":"mysql"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":410,"y":20},"size":{"width":75,"height":75},"angle":0,"id":"6851bc32-7bea-4386-bdb4-896c372c9dd3","z":29,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/svc.svg"},"label":{"text":"wordpress-mysql"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":130,"y":20},"size":{"width":75,"height":75},"angle":0,"id":"1767fd94-6ae6-441b-9fe1-97a0ee546fbc","z":29,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/svc.svg"},"label":{"text":"wordpress"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":420,"y":340},"size":{"width":75,"height":75},"angle":0,"id":"209dd8f1-fbeb-483e-bd45-936ba9172c37","z":31,"attrs":{"image":{"xlinkHref":"../images/general/folder-blue.svg"},"label":{"text":"NFS"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":250,"y":280},"size":{"width":75,"height":75},"angle":0,"id":"1d3d56ad-3083-40ff-b6a7-61f163c41808","z":31,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pv.svg"},"label":{"text":"WordPress"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Image","position":{"x":600,"y":290},"size":{"width":75,"height":75},"angle":0,"id":"37f4b74b-72d5-4550-9ef6-a15b65e28691","z":31,"attrs":{"image":{"xlinkHref":"../images/k8s-resources/labeled/pv.svg"},"label":{"text":"MYSQL"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Link","source":{"id":"209dd8f1-fbeb-483e-bd45-936ba9172c37"},"target":{"id":"1d3d56ad-3083-40ff-b6a7-61f163c41808"},"id":"2d640fd9-09a5-44b8-a635-c89065750166","z":32,"attrs":{}},{"type":"standard.Link","source":{"id":"209dd8f1-fbeb-483e-bd45-936ba9172c37"},"target":{"id":"37f4b74b-72d5-4550-9ef6-a15b65e28691"},"id":"4aced189-a4ea-43f3-9f8e-1ba75b01a964","z":33,"attrs":{}},{"type":"standard.Link","source":{"id":"1d3d56ad-3083-40ff-b6a7-61f163c41808"},"target":{"id":"0e383225-b978-45b4-a730-3b42b079beb5"},"id":"325466f3-f38f-47c7-b3a2-71d793878010","z":34,"attrs":{}},{"type":"standard.Link","source":{"id":"37f4b74b-72d5-4550-9ef6-a15b65e28691"},"target":{"id":"3b8dcabe-387b-4a88-a920-7282f15053b8"},"id":"a50a68bb-c41a-4d5f-9c43-2ec49d653236","z":35,"attrs":{}},{"type":"standard.Link","source":{"id":"0e383225-b978-45b4-a730-3b42b079beb5"},"target":{"id":"f8e3ce09-1850-4b63-b9fb-b9e154311952"},"id":"d7b5c350-034e-4004-affd-f4548822cec5","z":36,"attrs":{}},{"type":"standard.Link","source":{"id":"3b8dcabe-387b-4a88-a920-7282f15053b8"},"target":{"id":"b32b6a34-2f96-44a5-9e31-21a0aaaa90f6"},"id":"d3b84bf1-8873-443a-a8da-f23a7bcab5a2","z":37,"attrs":{}},{"type":"standard.Link","source":{"id":"f8e3ce09-1850-4b63-b9fb-b9e154311952"},"target":{"id":"6851bc32-7bea-4386-bdb4-896c372c9dd3"},"id":"e7eed7fe-0248-42f3-88f9-96f6927f8c38","z":38,"attrs":{}},{"type":"standard.Link","source":{"id":"6851bc32-7bea-4386-bdb4-896c372c9dd3"},"target":{"id":"b32b6a34-2f96-44a5-9e31-21a0aaaa90f6"},"id":"ad8f422c-dbfc-4e7a-9912-326585fc2c39","z":39,"attrs":{}},{"type":"standard.Link","source":{"id":"f8e3ce09-1850-4b63-b9fb-b9e154311952"},"target":{"id":"1767fd94-6ae6-441b-9fe1-97a0ee546fbc"},"id":"73ba33ad-afb0-4d1b-ba8c-63e62f315cad","z":40,"attrs":{}},{"type":"standard.Image","position":{"x":0,"y":20},"size":{"width":75,"height":75},"angle":0,"id":"pod1-123","z":59,"attrs":{"image":{"xlinkHref":"../images/general/user-blue.svg"},"label":{"text":"user"},"root":{"title":"joint.shapes.standard.Image"}}},{"type":"standard.Link","source":{"id":"pod1-123"},"target":{"id":"1767fd94-6ae6-441b-9fe1-97a0ee546fbc"},"id":"107f36dd-ed44-419e-a3e6-6db73112e2fe","z":60,"attrs":{}}]});

          //Setup canvas, drawing functions

    const colors = [ '#D8589F', '#EE4523', '#FBE75D', '#4FC5DF'];
    const bubbles = 80;

    const explode = (x, y) => {

        let particles = [];
        let ratio = window.devicePixelRatio;
        let c = document.createElement('canvas');
        let ctx = c.getContext('2d');

        c.style.position = 'absolute';
        c.style.left = (x - 100) + 'px';
        c.style.top = (y - 100) + 'px';
        c.style.pointerEvents = 'none';
        c.style.width = 500 + 'px';
        c.style.height = 500 + 'px';
        c.style.zIndex = 9999;
        c.width = 500 * ratio;
        c.height = 500 * ratio;
        document.body.appendChild(c);

        for(var i = 0; i < bubbles; i++) {
            particles.push({
                x: c.width / 2,
                y: c.height / r(2, 4),
                radius: r(3, 8),
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: r(230, 310, true),
                speed: r(3, 7),
                friction: .99,
                fade: .03,
                opacity: r(100, 100, true),
                yVel: 0,
                gravity: 0.04
            });
        }

        render(particles, ctx, c.width, c.height);
        setTimeout(() => document.body.removeChild(c), 5000);
    }

    const render = (particles, ctx, width, height) => {
        requestAnimationFrame(() => render(particles, ctx, width, height));
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p, i) => {
            p.x += p.speed * Math.cos(p.rotation * Math.PI / 180);
            p.y += p.speed * Math.sin(p.rotation * Math.PI / 180);

            p.opacity -= 0.005;
            p.speed *= p.friction;
            p.radius -= p.fade;
            p.yVel += p.gravity;
            p.y += p.yVel;

            if(p.opacity < 0 || p.radius < 0) return;

            ctx.beginPath();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, false);
            ctx.fill();
        });

        return ctx;
    }

    const r = (a, b, c) => parseFloat((Math.random() * ((a ? a : 1) - (b ? b : 0)) + (b ? b : 0)).toFixed(c ? c : 0));


    //Run the thing
//    const logo = document.querySelector('button');
//    logo.addEventListener('mouseover', (e) => {
//      x = logo.offsetLeft - 20;
//      y = logo.offsetTop - 120;
//      explode(x, y);
//    });

}]);