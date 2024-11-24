#!/bin/sh
#
# usage: minify.sh path/to/index.html

index="${1?index file must be specified}"
mindir="`pwd`/minify"

if ! test -d $mindir; then 
  git clone ssh://github.com/matthiasmullie/minify.git minify
elif ! (cd "$mindir" >/dev/null && git remote -v) | grep '/matthiasmullie/minify.git'; then
  echo "$mindir isn't empty and doesn't contain the right repo `git remote -vv`"
  exit 1
elif ! cd "`dirname "$index"`" 2>/dev/null; then
  echo "couldn't change to index directory: '`dirname "$index"`'"
  exit 1
fi

index="${index##*/}"

declare -a jsfiles
declare -a cssfiles

 if cd ./js 2>/dev/null; then 
  sed -n '/<!-- begin:minify.js -->/,/<!-- end:minify.js -->/ { 
    /<!--/ d; { 
      s/^.*src="\.\/js\///
      s/".*$//
      p
    }
  }' "../$index" \
  | while read file; do 
      cat "$file"
      echo ';' # just in case
      test -n "$MIN_CLEAN" && rm "$file"
    done >cffc-cat.js
    cd ..
else
  echo "couldn't find a 'js/' directory under index-root: '`pwd`'"
  echo "skipping js minification"
fi 

if test "$?" -ne "0"; then
  echo "failed to parse javascript header section from ${index}" >&2
  exit 1
elif ! "${mindir}/bin/minifyjs" ./js/cffc-cat.js >./js/cffc-min.js; then 
  echo "minification failed for javascript" >&2
  exit 1
elif ! cat >temp.html <<-EOF
  `sed -n '1,/begin:minify.js/ p' "$index"`
  <script src="./js/cffc-min.js" defer></script>
  `sed -n '/end:minify.js/,$ p' "$index"`
EOF
then
  echo "couldn't create temporary index for js" >&2
  exit 1
elif mv -v temp.html "$index"; then
  rm ./js/cffc-cat.js
else
  echo "couldn't replace '$index' for js" >&2
fi

if cd ./css 2>/dev/null; then 
  sed -n '/<!-- begin:minify.css -->/,/<!-- end:minify.css -->/ { 
    /<!--/ d; { 
      s/^.*href="\.\/css\///
      s/".*$//
      p
    }
  }' "../$index" \
  | while read file; do 
      cat "$file"
      test -n "$MIN_CLEAN" && rm "$file" >&2
    done >cffc-cat.css
    cd .. 2>/dev/null
else
  echo "couldn't find a 'css/' directory under index-root: '`pwd`'"
  echo "skipping css minification"
fi 

if test "$?" -ne "0"; then
  echo "failed to parse css header section from ${index}" >&2
  exit 1
# elif ! ../../minify/bin/minifycss ./css/cffc-cat.css >./css/cffc-min.css; then 
#   echo "minification failed for css" >&2
#   exit 1
elif ! cat >temp.html <<-EOF
  `sed -n '1,/begin:minify.css/ p' "$index"`
  <link href="./css/cffc-cat.css" rel="stylesheet">
  `sed -n '/end:minify.css/,$ p' "$index"`
EOF
then
  echo "couldn't create temporary index for css" >&2
  exit 1
elif mv -v temp.html "$index"; then
  echo "placeholder"
  # rm ./css/cffc-cat.css # FIXME: till minifycss above works
else
  echo "couldn't replace '$index' for css" >&2
fi
