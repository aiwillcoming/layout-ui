import React, { ReactElement, MouseEvent } from 'react'
const { useState } = React
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { TRowAST, Tstore } from '../types/index'
import { layoutTypeList, rowASTItemDefault } from '../model/constant'
import { createHtml, setTreeData, getTreeVal } from '../utils/utils'
import { docco, defaultRowNumber } from '../model/constant'
import { message, Tooltip } from 'antd'

interface Tstate {
    previewAST: TRowAST[],
}
interface Tprops extends Tstate {
    dispatch: Dispatch,
    previewAST: TRowAST[],
    selectRowPath: number[],
    html: string,
}

var tapingKey: string[] = []

document.onkeydown = (e: any) => {  
    var realkey = String.fromCharCode(e.which)
    tapingKey.push(realkey)
}  
document.onkeyup = (e: any) => {  
    var realkey = String.fromCharCode(e.which)
    tapingKey = tapingKey.filter(e => e !== realkey)
}  
let imageUrl = ''
const View = (props: Tprops) => {
    let rowAst  
    let getRowInfo = (typeIndex: number, rowNumber: number): TRowAST => {
        let layoutType = layoutTypeList[typeIndex].className

        rowAst = []
        for (let i = 0; i < rowNumber; i++) {
            rowAst.push(rowASTItemDefault)
        }
        return {
            tag: 'div',
            css: [''],
            style: {},
            children: [
                {
                    tag: 'div',
                    css: ['flex', layoutType, ''],
                    style: {},
                    children: rowAst
                }
            ]
        }
    }
    let getImageAst = (url: string): TRowAST => {
        return {
            tag: 'div',
            css: [''],
            style: {},
            children: [
                {
                    tag: 'img',
                    css: [''],
                    style: {},
                    src: url,
                    children: []
                }
            ]
        }
    }
    let addRow = (index: number) => () => {
        let downNumber: number = parseInt(tapingKey.filter((item, index, arr) => 
                arr.indexOf(item, 0) === index
            ).join('')
        ) || defaultRowNumber
        if(props.selectRowPath.length === 0){
            let ast: TRowAST[] = [...props.previewAST, getRowInfo(index, downNumber)]
            let htmlObject = createHtml(ast)
            let html =  htmlObject.view

            props.dispatch({
                type: 'previewHTML',
                html,
                ast
            })
        }else{
            let selectItem = getTreeVal(props.previewAST, props.selectRowPath.join('.children.'))
            if(selectItem.tag === 'div'){
                let dataAst: TRowAST[] = setTreeData(props.previewAST, {
                    path: props.selectRowPath,
                    childrenName: 'children',
                    value: {
                        ...getRowInfo(index, downNumber),
                        style: {...selectItem.style},
                        children: [
                            ...selectItem.children,
                            ...getRowInfo(index, downNumber).children
                        ]
                    }
                })
                props.dispatch({
                    type: 'previewHTML',
                    html: createHtml(dataAst).view,
                    ast: dataAst
                })
            }else{
                message.error('此类型不允许插入子节点')
            }
        }
    }
    let bindDrag = (index: number) => {
        return (e:  DragEventInit) => {
            e.dataTransfer && e.dataTransfer.setData('add', index + '')
        }
    }
    let addImage  = () => {
        if(props.selectRowPath.length === 0){
            let ast: TRowAST[] = [...props.previewAST, getImageAst(imageUrl)]
            let htmlObject = createHtml(ast)
            let html =  htmlObject.view
            props.dispatch({
                type: 'previewHTML',
                html,
                ast
            })
        }else{
            let selectItem = getTreeVal(props.previewAST, props.selectRowPath.join('.children.'))
            if(selectItem.tag === 'div'){
                let dataAst: TRowAST[] = setTreeData(props.previewAST, {
                    path: props.selectRowPath,
                    childrenName: 'children',
                    value: {
                        ...selectItem,
                        children: [
                            getImageAst(imageUrl)
                        ]
                    }
                })
                props.dispatch({
                    type: 'previewHTML',
                    html: createHtml(dataAst).view,
                    ast: dataAst
                })
            }else{
                message.error('此类型不允许插入子节点')
            }
        }
    }
    let [ tabIndex, settabindex ] = useState(0)
    let switchTab = (index: number) => () => {
        settabindex(index)
    }
    let getActiveClass = (index: number) => (tabIndex === index ? 'active': '')
    let selectRowDiv = (event: MouseEvent, path: number[]) => {
        event.stopPropagation()
        props.dispatch({
            type: 'selectRowPath',
            path
        })
    }
    let renderWorkDirectory = (tree: TRowAST[], path: number[]) => {
        let styles: any = {
            spaceStyle: {
                textAlign: 'right',
                overflow: 'auto',
                // textOverflow: 'ellipsis'
            }
        }
        return tree.map((row, index) => {
            let itemPath = [...path, index]
            return <div
                        key={index}
                        onClick={(e: MouseEvent) => selectRowDiv(e, itemPath)}
                        style={{
                            background: props.selectRowPath.join(',') === itemPath.join(',') ? 'rgb(197, 222, 245)' : ''
                        }}
                    >{row.children.length > 0
                ? renderWorkDirectory(row.children, itemPath)
                : <div style={{...styles.spaceStyle,
                    width: itemPath.length * 8 + 5 + 'px',
                }}>{row.tag}</div>
            }</div>
        })
    }
    return <div className="util_panel flex">
        <div className="switch">
            <Tooltip placement="right" title={'添加组件'}>
                <p onClick={switchTab(0)}><i className={`iconfont icon-jia ${getActiveClass(0)}`}></i></p>                
            </Tooltip>
            <Tooltip placement="right" title={'图层'}>
                <p onClick={switchTab(1)}><i className={`iconfont icon-tree ${getActiveClass(1)}`}></i></p>
            </Tooltip>
        </div>
        {tabIndex === 0 && <div style={{width: '225px'}} className="panel">
            <div className="add-layout">
                <div>Layout</div>
                <p draggable={true} onDragStart={bindDrag(0)}>
                    <img className="layout-svg" onClick={addRow(0)} src={require(`../svg/flex-row-x.svg`)} />
                </p>
                <p draggable={true} onDragStart={bindDrag(3)}>
                    <img className="layout-svg" onClick={addRow(3)} src={require(`../svg/flex-space-x.svg`)} />
                </p>
                <p draggable={true} onDragStart={bindDrag(2)}>
                    <img className="layout-svg" onClick={addRow(2)} src={require(`../svg/flex-center-x.svg`)} />
                </p>
                <p draggable={true} onDragStart={bindDrag(1)}>
                    <img className="layout-svg" onClick={addRow(1)} src={require(`../svg/flex-row-x-r.svg`)} />
                </p>
            </div>
            <div>
                <div>interactive</div>
                <div>image</div>
                <textarea className="input-textarea"  placeholder="url" onChange={(e: any) => {
                    imageUrl = e.target.value
                }} />
                <button onClick={addImage}>insert</button>
            </div>
        </div>}
        {tabIndex === 1 && <div style={{width: '225px', overflowX: 'auto', whiteSpace: 'nowrap'}} className="panel">
            {renderWorkDirectory(props.previewAST, [])}
        </div>}
        {/* <div className="add">
            <div>绘制</div>
            <p><i className="iconfont icon-kuangjiaframe23"></i>框</p>
            <p><i className="iconfont icon-tuoyuanxing"></i>圆角</p>
            <p><i className="iconfont icon-text_tool"></i>文字</p>
        </div> */}
    </div>
}

const stateMapToProps = (state: Tstore) => {
    return {
        previewAST: state.previewAST,
        selectRowPath: state.selectRowPath,
        html: state.previewHTML
    }
}
export default connect(stateMapToProps)(View)
