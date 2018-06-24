var $ = function(sel) {
  return document.querySelector(sel);
};
var $All = function(sel) {
  return document.querySelectorAll(sel);
};
var makeArray = function(likeArray) {
  var array = [];
  for (var i = 0; i < likeArray.length; ++i) {
    array.push(likeArray[i]);
  }
  return array;
};
var guid = 0;
var CL_COMPLETED = 'completed';
var CL_SELECTED = 'selected';
var CL_EDITING = 'editing';

var swiped = null;  //当前被左滑的元素

var timer = 0;  //判断触摸时间

function update() {
  model.flush();
  var data = model.data;
  
  var activeCount = 0;
  var todoList = $('.todo-list');
  todoList.innerHTML = '';
  data.items.forEach(function(itemData, index) {
    if (!itemData.completed) activeCount++;

    if (
      data.filter == 'All'
      || (data.filter == 'Active' && !itemData.completed)
      || (data.filter == 'Completed' && itemData.completed)
    ) {
      var item = document.createElement('li');
      var id = 'item' + guid++;
      item.setAttribute('id', id);
      if (itemData.completed) item.classList.add(CL_COMPLETED);
      item.innerHTML = [
        '<div class="view">',
        '  <input class="toggle" type="checkbox">',
        '  <label class="todo-label">' + itemData.msg + '</label>',
        '  <i>删除</i>',
        '</div>',
      ].join('');

      var view = item.querySelector('.view');
      var x,y,X,Y,swipeX,swipeY;
      view.addEventListener('touchstart', function(event){
        x = event.changedTouches[0].pageX;
        y = event.changedTouches[0].pageY;
        swipeX = true;
        swipeY = true ;
        if(swiped){
          swiped.className = "view";  //若之前有展开的元素，要收回
        }
      });

      view.addEventListener('touchmove', function(event) {
        X = event.changedTouches[0].pageX;
        Y = event.changedTouches[0].pageY;
        // 左右滑动
        if (swipeX && Math.abs(X - x) - Math.abs(Y - y) > 0) {
          // 阻止事件冒泡
          event.stopPropagation();
          if (X - x > 10) {   //右滑
            event.preventDefault();
            this.className = "view";    //右滑收起
          }
          if (x - X > 10) {   //左滑
            event.preventDefault();
            this.className = "swipeleft";   //左滑展开
            swiped = this;
          }
          swipeY = false;
        }
        // 上下滑动
        if (swipeY && Math.abs(X - x) - Math.abs(Y - y) < 0) {
          swipeX = false;
        }
      });

      var i = item.querySelector('.view i');
      i.addEventListener('touchstart', function(){
        data.items.splice(index, 1);  //删除该条
        update();
      });

      var label = item.querySelector('.todo-label');
      label.addEventListener('dblclick', function() {
        item.classList.add(CL_EDITING);

        var edit = document.createElement('input');
        var finished = false;
        edit.setAttribute('type', 'text');
        edit.setAttribute('class', 'edit');
        edit.setAttribute('value', label.innerHTML);

        function finish() {
          if (finished) return;
          finished = true;
          item.removeChild(edit);
          item.classList.remove(CL_EDITING);
        }

        edit.addEventListener('blur', function() {
          finish();
        }, false);

        edit.addEventListener('keyup', function(ev) {
          if (ev.keyCode == 27) { // Esc
            finish();
          }
          else if (ev.keyCode == 13) {// Enter
            label.innerHTML = this.value;
            itemData.msg = this.value;
            update();
          }
        }, false);

        item.appendChild(edit);
        edit.focus();
      }, false);

      function label_touch(){
        timer = setTimeout(function () {
          item.classList.add(CL_EDITING);

          var edit = document.createElement('input');
          var finished = false;
          edit.setAttribute('type', 'text');
          edit.setAttribute('class', 'edit');
          edit.setAttribute('value', label.innerHTML);

          function finish() {
            if (finished) return;
            finished = true;
            item.removeChild(edit);
            item.classList.remove(CL_EDITING);
          }

          edit.addEventListener('blur', function() {
            finish();
          }, false);

          edit.addEventListener('keyup', function(ev) {
            if (ev.keyCode == 27) { // Esc
              finish();
            }
            else if (ev.keyCode == 13) {// Enter
              label.innerHTML = this.value;
              itemData.msg = this.value;
              update();
            }
          }, false);
          item.appendChild(edit);
          timer = 0;  //确认是长按，不执行点击事件
        },300); //长按0.3s进入编辑
        return false;
      }

      label.addEventListener('touchstart', label_touch);

      label.addEventListener('touchend',function(event){
        clearTimeout(timer);
        if(timer!=0){
          //点击
          itemData.completed = !itemData.completed;
          update();
          event.stopPropagation();
        }
        return false;
      });

      label.addEventListener('touchmove',function(){
        clearTimeout(timer);
        timer = 0;
      });

      var itemToggle = item.querySelector('.toggle');
      itemToggle.checked = itemData.completed;
      itemToggle.addEventListener('change', function() {
        itemData.completed = !itemData.completed;
        update();
      }, false);

      /*item.querySelector('.destroy').addEventListener('click', function() {
        data.items.splice(index, 1);
        update();
      }, false);*/

      todoList.insertBefore(item, todoList.firstChild);
    }
  });

  var newTodo = $('.new-todo');
  newTodo.value = data.msg;

  var completedCount = data.items.length - activeCount;
  var count = $('.todo-count');
  count.innerHTML = (activeCount || 'No') + (activeCount > 1 ? ' items' : ' item') + ' left';

  var clearCompleted = $('.clear-completed');
  clearCompleted.style.visibility = completedCount > 0 ? 'visible' : 'hidden';

  var toggleAll = $('.toggle-all');
  toggleAll.style.visibility = data.items.length > 0 ? 'visible' : 'hidden';
  toggleAll.checked = data.items.length == completedCount;

  var filters = makeArray($All('.filters li a'));
  filters.forEach(function(filter) {
    if (data.filter == filter.innerHTML) filter.classList.add(CL_SELECTED);
    else filter.classList.remove(CL_SELECTED);
  });
}

window.onload = function() {
  model.init(function(){
    var data = model.data;
    
    var newTodo = $('.new-todo');
    newTodo.addEventListener('keyup', function() {
      data.msg = newTodo.value;
    });
    newTodo.addEventListener('change', function() {
      model.flush();
    });
    newTodo.addEventListener('keyup', function(ev) {
      if (ev.keyCode != 13) return; // Enter

      if (data.msg == '') {
        console.warn('input msg is empty');
        return;
      }
      data.items.push({msg: data.msg, completed: false});
      data.msg = '';
      update();
    }, false);

    var clearCompleted = $('.clear-completed');
    clearCompleted.addEventListener('touchstart', function() {
      var new_data = [];
      data.items.forEach(function(itemData, index) {
        if (!itemData.completed){
         new_data.push(data.items[index]);
        }
      });
      data.items=new_data;
      update();
    }, false);

    var toggleAll = $('.toggle-all');
    toggleAll.addEventListener('change', function() {
      var completed = this.checked;
      data.items.forEach(function(itemData) {
        itemData.completed = completed;
      });
      update();
    }, false);

    var filters = makeArray($All('.filters li a'));
    filters.forEach(function(filter) {
      filter.addEventListener('touchstart', function() {
        data.filter = filter.innerHTML;
        filters.forEach(function(filter) {
          filter.classList.remove(CL_SELECTED);
        });
        filter.classList.add(CL_SELECTED);
        update();
      }, false);
    });

    update();
  });
};