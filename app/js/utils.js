/* global preloaded_images:true polyLabeling:true bboxLabeling:true
 type:true imageList:true numDisplay:true assignment:true
 BBoxLabeling currentIndex:true PolyLabeling updateCategory numPoly:true
*/
/* exported loadAssignment goToImage getIPAddress pickColorPalette*/

// Global variables
var imageList = [];
var currentIndex = 0;
var numDisplay = 0;
var bboxLabeling;
var LabelList;
var LabelChart = [];
var preloaded_images = [];
var assignment;
var numPoly = 0;
var type;

let COLOR_PALETTE = [
  [31, 119, 180],
  [174, 199, 232],
  [255, 127, 14],
  [255, 187, 120],
  [44, 160, 44],
  [152, 223, 138],
  [214, 39, 40],
  [255, 152, 150],
  [148, 103, 189],
  [197, 176, 213],
  [140, 86, 75],
  [196, 156, 148],
  [227, 119, 194],
  [247, 182, 210],
  [127, 127, 127],
  [199, 199, 199],
  [188, 189, 34],
  [219, 219, 141],
  [23, 190, 207],
  [158, 218, 229],
];

// Go to previous image
$('#prev_btn').click(function() {
  goToImage(currentIndex - 1);
});

// Go to next image
$('#next_btn').click(function() {
  goToImage(currentIndex + 1);
});

// Save task
$('#save_btn').click(function() {
  save();
});

let blendColor = function(rgb, base, ratio) {
  let newRgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    newRgb[i] = Math.max(0,
        Math.min(255, rgb[i] + Math.round((base[i] - rgb[i]) * ratio)));
  }
  return newRgb;
};

/* check full palette and usage: https://jsfiddle.net/739397/e980vft0/ */
function pickColorPalette(index) {
  let colorIndex = index % COLOR_PALETTE.length;
  let shadeIndex = (Math.floor(index / COLOR_PALETTE.length)) % 3;
  let rgb = COLOR_PALETTE[colorIndex];
  if (shadeIndex === 1) {
    rgb = blendColor(rgb, [255, 255, 255], 0.4);
  } else if (shadeIndex === 2) {
    rgb = blendColor(rgb, [0, 0, 0], 0.2);
  }
  return rgb;
}

/**
 * Summary: Record timestamp in milliseconds, action, and target image index.
 * @param {type} action: To be completed.
 * @param {type} index: Description.
 * @param {type} position: Description.
 */
function addEvent(action, index, position) {
  if (!assignment.events) {
    assignment.events = [];
  }
  let event = {
    'timestamp': Math.round(new Date() / 1000),
    'action': action,
    'targetIndex': index.toString(),
    'position': position // only applicable to certain actions
  };
  assignment.events.push(event);
}

/**
 * Summary: Preload images using browser caching.
 * @param {type} imageArray: To be completed.
 * @param {type} index: Description.
 */
function preload(imageArray, index) {
  index = index || 0;
  if (imageArray && imageArray.length > index) {
    preloaded_images[index] = new Image();
    preloaded_images[index].onload = function() {
      // addEvent("image loaded", index);
      if (index === 0) {
        // display when the first image is loaded
        if (type === 'bbox') {
          bboxLabeling = new BBoxLabeling({
            url: preloaded_images[currentIndex].src,
          });
          bboxLabeling.replay();
        } else {
          polyLabeling = new PolyLabeling({
            url: preloaded_images[currentIndex].src,
          });
          polyLabeling.updateImage(
              preloaded_images[currentIndex].src);
        }
        numDisplay = numDisplay + 1;
      }
      preload(imageArray, index + 1);
    };
    preloaded_images[index].onerror = function() {
      addEvent('image fails to load', index);
      preload(imageArray, index + 1);
    };
    preloaded_images[index].src = imageArray[index].url;
  } else {
    $('#prev_btn').attr('disabled', false);
    $('#next_btn').attr('disabled', false);
  }
}

/**
 * Summary: To be completed.
 *
 */
function updateProgressBar() {
  let progress = $('#progress');
  progress.html(' ' + (currentIndex + 1).toString() + '/' +
      imageList.length.toString());
}

/**
 * Summary: To be completed.
 *
 */
function resetEvents() {
  $('[name=\'occluded-checkbox\']').bootstrapSwitch();
  $('[name=\'truncated-checkbox\']').bootstrapSwitch();

  $('.btn-popover').hover(function() {
    $('.btn-popover').popover('show');
  }, function() {
    $('.btn-popover').popover('hide');
  });

  $('#image_finder').find('input[name="image_id"]').val(currentIndex + 1);
  $('#find_btn').click(function() {
    let index =
        parseInt($('#image_finder').find('input[name="image_id"]').val()) - 1;
    goToImage(index);
  });

  $('#image_finder').submit(function() {
    return false;
  });
}

/**
 * Summary: To be completed.
 *
 */
function updateCategorySelect() {
  if (type == 'poly') {
    updateCategory();
  } else {
    let category = assignment.category;
    let categorySelect = $('select#category_select');
    for (let i = 0; i < category.length; i++) {
      if (category[i]) {
        categorySelect.append('<option>' +
            category[i] + '</option>');
      }
    }
    $('select#category_select').val(assignment.category[0]);
  }
}

/**
 * Summary: To be completed.
 *
 */

function updateCategory() {
  let category = LabelList;
  let select = document.getElementById('category_select');
  select.setAttribute('size', LabelList.length);
  if (category.length !== 0) {
    for (var i = 0; i < category.length; i++) {
      if (category[i]) {
        $('select#category_select').
            append('<option>' + category[i] + '</option>');
      }
    }
    $('#category_select').val(category[0]);
    document.getElementById('name_select').
        setAttribute('size', LabelChart[0].length);
    for (var j = 0; j < LabelChart[0].length; j++)
      $('select#name_select').
          append('<option>' + LabelChart[0][j] + '</option>');
    $('#name_select').val(LabelChart[0][0]);
  }
}

/**
 * Summary: Update global image list.
 *
 */
function saveLabels() {
  if (type == 'bbox') {
    bboxLabeling.submitLabels();
    imageList[currentIndex].labels = bboxLabeling.output_labels;
    imageList[currentIndex].tags = bboxLabeling.output_tags;
  } else {
    polyLabeling.submitLabels();
    imageList[currentIndex].labels = polyLabeling.output_labels;
  }
}

/**
 * Summary: To be completed.
 *
 */
function submitAssignment() {
  let x = new XMLHttpRequest();
  x.onreadystatechange = function() {
    if (x.readyState === 4) {
      // console.log(x.response)
    }
  };

  assignment.numLabeledImages = currentIndex + 1;
  assignment.userAgent = navigator.userAgent;
  // console.log(assignment.images);
  // console.log(assignment);

  x.open('POST', './postSubmission');
  x.send(JSON.stringify(assignment));
}

/**
 * Summary: To be completed.
 *
 */
function save() {
  saveLabels();
  // auto save submission for the current session.
  submitAssignment();
  if (currentIndex !== imageList.length - 1) {
    addEvent('save', currentIndex);
  } else {
    addEvent('submit', currentIndex);
    // alert("Good Job! You've completed this assignment.");
  }
}

/**
 * Summary: To be completed.
 *
 */
function submitLog() {
  let x = new XMLHttpRequest();
  x.onreadystatechange = function() {
    if (x.readyState === 4) {
      // console.log(x.response)
    }
  };
  assignment.images = imageList;
  assignment.numLabeledImages = currentIndex + 1;
  assignment.userAgent = navigator.userAgent;

  x.open('POST', './postLog');
  x.send(JSON.stringify(assignment));
}

/**
 * Summary: To be completed.
 *
 */
function loadAssignment() {
  resetEvents();
  let x = new XMLHttpRequest();
  x.onreadystatechange = function() {
    if (x.readyState === 4) {
      // console.log(x.response);
      assignment = JSON.parse(x.response);
      imageList = assignment.images;
      currentIndex = 0;
      addEvent('start labeling', currentIndex);
      assignment.startTime = Math.round(new Date() / 1000);

      // preload images
      preload(imageList);
      if (type === 'poly') {
        for (var idx in imageList) {
          if (imageList[idx].hasOwnProperty('labels')) {
            var labels = imageList[idx].labels;
            for (let key in labels) {
              if (labels.hasOwnProperty(key)) {
                // let label = labels[key];
                // 'label' is assigned a value but never used
                // To be completed
                numPoly = numPoly + 1;
              }
            }
          }
        }
        $('#poly_count').text(numPoly);
      }
      updateCategorySelect();
      updateProgressBar();
    }
  };

  // get params from url path
  let searchParams = new URLSearchParams(window.location.search);
  let taskId = searchParams.get('task_id');
  let projectName = searchParams.get('project_name');

  let request = JSON.stringify({
    'assignmentId': taskId,
    'projectName': projectName,
  });

  x.open('POST', './requestSubmission');
  x.send(request);
}

/**
 * Summary: To be completed.
 *
 */
function getIPAddress() {
  $.getJSON('//ipinfo.io/json', function(data) {
    assignment.ipAddress = data;
  });
}

/**
 * Summary: To be completed.
 * @param {type} index: Description.
 */
function goToImage(index) {
  saveLabels();
  // auto save log every twenty five images displayed
  if (numDisplay % 25 === 0 && numDisplay !== 0) {
    submitLog();
    addEvent('save log', index);
  }
  // auto save submission for the current session.
  submitAssignment();

  if (index === -1) {
    alert('This is the first image.');
  } else if (index === imageList.length) {
    addEvent('submit', index);
    alert('Good Job! You\'ve completed this assignment.');
  } else {
    currentIndex = index;
    numDisplay = numDisplay + 1;
    addEvent('save', index);
    if (index === imageList.length - 1) {
      $('#save_btn').text('Submit');
      $('#save_btn').removeClass('btn-primary').addClass('btn-success');
    }
    if (index === imageList.length - 2) {
      $('#save_btn').removeClass('btn-success').addClass('btn-primary');
      $('#save_btn').text('Save');
    }
    addEvent('display', index);
    updateProgressBar();
    if (type === 'bbox') {
      bboxLabeling.updateImage(preloaded_images[index].src);
      bboxLabeling.replay();
    } else {
      polyLabeling.clearAll();
      polyLabeling.updateImage(preloaded_images[index].src);
    }
  }
}