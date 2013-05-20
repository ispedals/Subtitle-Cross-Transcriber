(function(){

    var getKeys = function(obj){
       var keys = [];
       for(var key in obj)
       {
          keys.push(key);
       }
       return keys;
    };
    
    var makeMap = function (str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i].trim() ] = true;
		return obj;
	};

    var blockTag = /^\[([^\]]+)\]$/;
    var infoTag = /^(\w+)\:\s?(.+)(?:\s+)?$/;
    
    var blocks={
        'Script Info': {
            validEntries: makeMap('Title, Original Script, Original Translation, Original Editing, Original Timing, Synch Point, Script Updated By, Update Details, Script Type, Collisions, PlayResY, PlayResX, PlayDepth, Timer, WrapStyle'),
            hasFormat: false
        },
        'V4+ Styles': {
            validEntries: makeMap('Style'),
            hasFormat: true,
            formatTokens: makeMap('Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding'),
            format:null
        }, 
        'Events': {
            validEntries: makeMap('Dialogue'),
            hasFormat: true,
            formatTokens: makeMap('Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'),
            format:null
        },
    };
   
    var ASSParser = this.ASSParser = function( file, handler ) {
        var lines = file.split(/\r\n|\n|\r/);
        var currentBlock=null;
        
        for (var i=0; i<lines.length; i++)
        {
            var line=lines[i];
            var match=line.match(blockTag);
            if(match)
            {
                currentBlock=match[1];
                if(handler.block)
                {
                    handler.block(currentBlock);
                }
                continue;                    
            }
            if(blocks[currentBlock] === 'undefined')
            {
                continue;
            }
            match=line.match(infoTag);
            if(!match)
            {
                continue;
            }
            var key = match[1], value = match[2];
            if(!blocks[currentBlock]['hasFormat'])
            {
               if(blocks[currentBlock]['validEntries'][key] && handler.infoLine)
                {
                    handler.infoLine(currentBlock, key, value);
                }
            }
            else if(blocks[currentBlock]['hasFormat'])
            {
                if(!blocks[currentBlock]['format'] && key === 'Format')
                {
                    blocks[currentBlock]['format']=parseFormat(value, blocks[currentBlock]['formatTokens']);
                    if(handler.format)
                    {
                        handler.format(currentBlock, blocks[currentBlock]['format']);
                    }
                    continue;
                }
                else if(blocks[currentBlock]['validEntries'][key])
                {
                    if(handler.formmatedInfoLine)
                    {
                        var ret={};
                        var format=blocks[currentBlock]['format'];
                        var tokens = value.split(/,/);//will also split on commas in text
                        var text = tokens.slice(format['length']-1,tokens.length).join(''); // so slice out the elements starting from the text element until the end and join them together
                        tokens.splice(format['length']-1,text.length,text); //and add them back,
                        var formatKeys=getKeys(format);
                        for (var x=0; x<formatKeys.length;x++)
                        {
                            var formatKey=formatKeys[x];
                            if(formatKey === 'length')
                            {
                                continue;
                            }
                            ret[formatKey]=tokens[format[formatKey]].trim();
                        }
                        handler.formmatedInfoLine(currentBlock,ret);                        
                    }
                }
            }
            
        }
        
        if(handler.done)
        {
            handler.done('done');
        }
        function parseFormat(string, formatTokens)
        {
            var format={};
            var tokens = string.split(/,/);
            format.length = tokens.length;
            for (var i = 0; i < tokens.length; i++)
            {
                var token = tokens[i].trim();
                if(formatTokens[token])
                {
                    format[token] = i;
                }
            }
            return format;
        }
    }
})();